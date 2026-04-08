exports.handler = async function (event) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // 构造最简单的请求体，不带任何复杂逻辑
  const payload = {
    contents: [{ parts: [{ text: "你好，请回复'测试成功'" }] }]
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // 把 Google 返回的原始信息打印出来，这是破案关键
    console.log("Google Response:", JSON.stringify(data));

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
