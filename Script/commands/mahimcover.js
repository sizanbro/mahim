const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "mahimcover",
  version: "1.0",
  hasPermssion: 0,
  credits: "alexfiqure & Copilot",
  description: "Auto send random Facebook cover when someone says 'mahim'",
  usePrefix: false,
  commandCategory: "Auto",
  category: "auto",
  usages: "",
  cooldowns: 3,
};

module.exports.handleEvent = async function({ api, event }) {
  if (
    !event.body ||
    !/mahim/i.test(event.body)
  ) return;

  const imageUrl = "https://picsum.photos/900/300";
  const savePath = __dirname + "/cache/mahimcover.jpg";

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.mkdirSync(__dirname + "/cache", { recursive: true });
    fs.writeFileSync(savePath, Buffer.from(response.data, "utf-8"));
  } catch (e) {
    return api.sendMessage("❌ Failed to fetch a random cover image.", event.threadID);
  }

  api.sendMessage(
    {
      body: "౨ৎ— Here is a random Facebook cover for mentioning Mahim! 😊🍒",
      attachment: fs.createReadStream(savePath),
    },
    event.threadID,
    () => {
      setTimeout(() => {
        try { fs.unlinkSync(savePath); } catch (e) {}
      }, 30 * 1000);
    },
    event.messageID
  );
};

module.exports.run = async function() {};
