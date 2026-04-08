exports.handler = async function (event) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // 1. 获取前端传来的内容
  let userContent;
  try {
    const body = JSON.parse(event.body);
    userContent = body.contents;
  } catch (e) {
    userContent = [{ parts: [{ text: "你好" }] }];
  }

  // 2. 使用稳定的 v1 版本和 gemini-1.5-flash
  // 注意这里去掉了 beta
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: userContent })
    });

    const data = await response.json();
    console.log("Google Response:", JSON.stringify(data));

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
