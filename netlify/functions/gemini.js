exports.handler = async function (event) {
  // 只允许 POST 请求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "服务器未配置 API Key，请在 Netlify 环境变量中设置 GEMINI_API_KEY" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "请求格式错误，非有效 JSON" }) };
  }

  /**
   * 根据你刚才查询到的可用模型列表进行配置
   * 优先使用 2.5-flash，因为它是你列表里排在第一位的稳定模型
   */
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest" // 这是一个别名，通常会自动指向你可用的最新 flash 模型
  ];

  let lastError = null;

  for (const model of models) {
    // 使用 v1beta 路径，这是目前支持 2.5 和 2.0 系列最全的接口版本
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      console.log(`正在尝试模型: ${model}`);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // 如果遇到 429 (频率限制) -> 尝试下一个模型
      if (response.status === 429 || data?.error?.code === 429) {
        lastError = `模型 ${model} 频率超限 (429)`;
        console.warn(lastError);
        continue;
      }

      // 如果遇到 404 (找不到模型) -> 尝试下一个模型
      if (response.status === 404 || data?.error?.code === 404) {
        lastError = `模型 ${model} 不存在 (404)`;
        console.warn(lastError);
        continue;
      }

      // 如果返回其他错误
      if (!response.ok) {
        lastError = data?.error?.message || `模型 ${model} 返回错误 ${response.status}`;
        console.error(`请求失败: ${lastError}`);
        continue;
      }

      // 只要有一个模型成功，立即返回结果
      console.log(`成功通过模型 ${model} 获取结果`);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Model-Used": model,
        },
        body: JSON.stringify(data),
      };

    } catch (err) {
      lastError = `${model} 请求发生网络异常: ${err.message}`;
      console.error(lastError);
      continue;
    }
  }

  // 如果循环结束都没有成功，返回最后一次捕获到的错误
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "所有可用模型均调用失败",
      detail: lastError,
      suggestion: "请检查 API Key 是否正确粘贴（无空格）且已在 Google Cloud 控制台启用 Generative Language API"
    }),
  };
};
