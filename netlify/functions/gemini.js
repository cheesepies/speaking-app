exports.handler = async function (event) {
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
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Model fallback chain: try each in order until one succeeds
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
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

      // Quota exhausted → try next model
      if (response.status === 429 || data?.error?.code === 429) {
        lastError = `${model} 额度已用完`;
        continue;
      }

      if (!response.ok) {
        lastError = data?.error?.message || `${model} 返回错误 ${response.status}`;
        continue;
      }

      // Success
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Model-Used": model,
        },
        body: JSON.stringify(data),
      };
    } catch (err) {
      lastError = `${model} 请求失败: ${err.message}`;
      continue;
    }
  }

  // All models exhausted
  return {
    statusCode: 429,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error: `所有模型额度均已用完（${lastError}）。请检查你的 Gemini API Key 是否已启用，或稍后重试。`,
      hint: "前往 https://aistudio.google.com/apikey 确认 Key 状态",
    }),
  };
};
