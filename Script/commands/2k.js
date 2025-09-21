const axios = require("axios");

module.exports.config = {
 name: "pair4",
 version: "1.0.1",
 hasPermssion: 0,
 credits: "mahim islam",
 description: "${pn} reply to an image to upscale it to 2K resolution.",
 commandCategory: "Picture",
 cooldowns: 5,
 dependencies: {
 "axios": ""
 }
};

  onStart: async function ({ message, event }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("📸 Please reply to an image to upscale it.");
    }

    const imgurl = encodeURIComponent(event.messageReply.attachments[0].url);
    const upscaleUrl = `https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image?imageUrl=${imgurl}&apikey=ArYANAHMEDRUDRO`;

    message.reply("🔄 Processing your image, please wait...", async (err, info) => {
      try {
        const response = await axios.get(upscaleUrl);
        const imageUrl = response.data.resultImageUrl;
        const attachment = await global.utils.getStreamFromURL(imageUrl, "upscaled.png");

        message.reply({
          body: "✅ Your 2K upscaled image is ready!",
          attachment
        });

        message.unsend(info.messageID);
      } catch (error) {
        console.error("Upscale Error:", error.message);
        message.reply("❌ Error occurred while upscaling the image.");
      }
    });
  }
};
      
