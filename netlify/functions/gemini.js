exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "未配置 API Key" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // 关键：这里必须包含你测试通过的 2.5 系列模型
  const models = [
    "gemini-2.5-flash", 
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 429 || data?.error?.code === 429) {
        lastError = `${model} 额度已用完`;
        continue;
      }

      if (!response.ok) {
        lastError = data?.error?.message || `${model} 返回错误 ${response.status}`;
        continue;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "X-Model-Used": model },
        body: JSON.stringify(data),
      };
    } catch (err) {
      lastError = `${model} 请求失败: ${err.message}`;
      continue;
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({ error: "所有模型均失败", detail: lastError }),
  };
};
