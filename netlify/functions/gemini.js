exports.handler = async function (event) {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = JSON.parse(event.body);

  // 恢复多个模型尝试，避免单个模型限流
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b"
  ];

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        };
      }
      console.log(`Model ${model} failed:`, data.error?.message);
    } catch (err) {
      console.error(err);
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({ error: "所有模型尝试均失败，请检查 Google Cloud API 启用状态" })
  };
};
