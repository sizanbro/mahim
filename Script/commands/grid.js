// Grid Command for sizanbro/ok bot (Messenger integration ready)
// Features: custom grid size, stylish templates, message reactions, image captions, auto-fit layout

const Jimp = require('jimp');

// Example templates
const templates = {
  classic: { borderRadius: 0, shadow: false, border: false },
  rounded: { borderRadius: 24, shadow: false, border: false },
  shadow: { borderRadius: 0, shadow: true, border: false },
  stylish: { borderRadius: 32, shadow: true, border: true },
  polaroid: { borderRadius: 12, shadow: true, border: true }
};

/**
* Adds rounded corners to a Jimp image.
*/
function roundCorners(img, radius) {
  const mask = new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
  mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function (x, y, idx) {
    const dx = Math.min(x, mask.bitmap.width - x - 1);
    const dy = Math.min(y, mask.bitmap.height - y - 1);
    if (dx < radius && dy < radius && Math.sqrt(dx * dx + dy * dy) > radius) {
      mask.bitmap.data[idx + 3] = 0;
    } else {
      mask.bitmap.data[idx + 3] = 255;
    }
  });
  img.mask(mask, 0, 0);
}

/**
* Adds a drop shadow to a Jimp image.
*/
async function addShadow(img) {
  const shadowSize = 16;
  const shadow = new Jimp(img.bitmap.width + shadowSize, img.bitmap.height + shadowSize, 0x00000000);
  const blurShadow = new Jimp(img.bitmap.width, img.bitmap.height, 0x44444488);
  blurShadow.blur(10);
  shadow.composite(blurShadow, shadowSize / 2, shadowSize / 2);
  shadow.composite(img, 0, 0);
  return shadow;
}

/**
* Adds a border around a Jimp image.
*/
function addBorder(img, borderSize = 8, borderColor = 0xffffffff) {
  const bordered = new Jimp(
    img.bitmap.width + borderSize * 2,
    img.bitmap.height + borderSize * 2,
    borderColor
  );
  bordered.composite(img, borderSize, borderSize);
  return bordered;
}

/**
* Adds a caption below each image in the grid.
*/
async function addCaption(img, caption, fontSize = Jimp.FONT_SANS_16_BLACK) {
  const font = await Jimp.loadFont(fontSize);
  const textHeight = 28;
  const captioned = new Jimp(img.bitmap.width, img.bitmap.height + textHeight, 0xffffffff);
  captioned.composite(img, 0, 0);
  captioned.print(font, 0, img.bitmap.height + 3, {
    text: caption,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, img.bitmap.width, textHeight);
  return captioned;
}

/**
* Creates a stylish grid collage from images using a selected template and captions.
* @param {string[]} imagePaths - Paths to the user images.
* @param {number} gridWidth
* @param {number} gridHeight
* @param {string} templateKey - One of: classic, rounded, shadow, stylish, polaroid
* @param {string[]} captions - Optional array of captions (same length as imagePaths or empty).
* @returns {Promise<string>} - Path to the generated grid image.
*/
async function createGrid(imagePaths, gridWidth = 2, gridHeight = 2, templateKey = 'stylish', captions = []) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) throw new Error('No images provided.');
  if (!templates[templateKey]) throw new Error('Template not found.');

  // Messenger reaction: processing...
  // sendReaction('processing'); // Implement in your bot if needed

  const template = templates[templateKey];
  const images = await Promise.all(imagePaths.map(p => Jimp.read(p)));

  // Use minimum size for uniform cells
  let cellW = Math.min(...images.map(i => i.bitmap.width));
  let cellH = Math.min(...images.map(i => i.bitmap.height));

  // Apply template effects and captions
  const processedImages = [];
  for (let idx = 0; idx < images.length; idx++) {
    let img = images[idx].clone().resize(cellW, cellH);

    if (template.borderRadius) roundCorners(img, template.borderRadius);
    if (template.shadow) img = await addShadow(img);
    if (template.border) img = addBorder(img, 10, 0xffeeeeee);
    if (captions[idx]) img = await addCaption(img, captions[idx], Jimp.FONT_SANS_16_BLACK);

    processedImages.push(img);
    // Optionally send progress reaction here
  }

  // Auto-fit: If not enough images, repeat last or fill with blank
  while (processedImages.length < gridWidth * gridHeight) {
    processedImages.push(new Jimp(cellW, cellH, 0xfff0f0f0));
  }

  // Calculate final cell size (may be changed by border/caption)
  cellW = Math.max(...processedImages.map(i => i.bitmap.width));
  cellH = Math.max(...processedImages.map(i => i.bitmap.height));

  // Create grid canvas (white background)
  const gridCanvas = new Jimp(cellW * gridWidth, cellH * gridHeight, 0xffffffff);

  let i = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (i < processedImages.length) {
        gridCanvas.composite(processedImages[i], x * cellW, y * cellH);
        i++;
      }
    }
  }

  const filename = `grid_${Date.now()}.jpg`;
  await gridCanvas.writeAsync(filename);

  // Messenger reaction: success or error
  // sendReaction('success'); // Implement in your bot if needed

  return filename;
}

/**
* Handler for your Messenger bot's .grid command.
* @param {string[]} imagePaths - User-uploaded photos.
* @param {Object} opts - { gridWidth, gridHeight, template, captions }
* @returns {Promise<Object>} - { message, file }
*/
async function handleGridCommand(imagePaths, opts = {}) {
  try {
    const gridWidth = opts.gridWidth || 2;
    const gridHeight = opts.gridHeight || 2;
    const template = opts.template || 'stylish';
    const captions = opts.captions || [];

    const gridImg = await createGrid(imagePaths, gridWidth, gridHeight, template, captions);

    // Reaction: success
    // sendReaction('success', opts.replyMessageId); // Hook up to Messenger

    return {
      message: `✅ Your stylish grid (${template}) is ready!`,
      file: gridImg
    };
  } catch (err) {
    // Reaction: error
    // sendReaction('error', opts.replyMessageId); // Hook up to Messenger

    return {
      message: `❌ Error: ${err.message}`,
      error: true
    };
  }
}

module.exports = {
  createGrid,
  handleGridCommand,
  templates
};
