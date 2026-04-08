exports.handler = async function (event) {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = JSON.parse(event.body);

  // 尝试最标准的 v1beta 路径，并显式指定模型
  // 这里的模型名换成 gemini-1.5-flash-latest (这是最推荐的别名)
  const modelName = "gemini-1.5-flash-latest";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: body.contents })
    });

    const data = await response.json();
    console.log("Debug - Status:", response.status);
    console.log("Debug - Data:", JSON.stringify(data));

    // 如果还是 404，尝试一个备用路径
    if (response.status === 404) {
       return {
         statusCode: 404,
         body: JSON.stringify({ 
           msg: "模型依然找不到，请检查 Netlify 日志中的 Debug 信息",
           error: data 
         })
       };
    }

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
