class GIF {
  header;
  logicalScreenDescriptor = {
    canvasWidth: "",
    canvasHeight: "",
    packedField: "",
    backgroundColorIndex: "",
    pixelAspectRatio: "",
  };
  globalColorTable;
  extensions = []; // (e.g., Global Control Extension, Comment Extension, Application Extension, Plain Text Extension)
  frames = []; // images
  terminator;
}

class Decoder {
  #gif = new GIF();
  #position = 0;

  constructor(buffer) {
    this.buffer = new Uint8Array(buffer);
  }

  decode() {
    this.#parseHeader();
    this.#parseLogicalScreenDescriptor();
    this.#parseGlobalColorTable();
    this.#parseExtensionsWithImageData();
    return this.#gif;
  }

  #readBytes(length) {
    const result = this.buffer.slice(this.#position, this.#position + length);
    this.#position += length;
    return result;
  }

  #readByte() {
    return this.buffer[this.#position++];
  }

  #readString(length) {
    let str = "";
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(this.#readByte());
    }
    return str;
  }

  #readShort() {
    return this.#readByte() + (this.#readByte() << 8);
  }

  // Header (6 bytes)
  #parseHeader() {
    const header = this.#readString(6);
    if (header !== "GIF87a" && header !== "GIF89a") {
      throw new Error("Invalid GIF header");
    }
    this.#gif.header = header;
  }

  // Logical Screen Descriptor (7 bytes)
  #parseLogicalScreenDescriptor() {
    this.#gif.logicalScreenDescriptor.canvasWidth = this.#readShort();
    this.#gif.logicalScreenDescriptor.canvasHeight = this.#readShort();
    this.#gif.logicalScreenDescriptor.packedField = this.#readByte();
    this.#gif.logicalScreenDescriptor.backgroundColorIndex = this.#readByte();
    this.#gif.logicalScreenDescriptor.pixelAspectRatio = this.#readByte();
  }

  // Global Color Map (3*2^(N+1)) 3 btyes for each color
  #parseGlobalColorTable() {
    const globalColorTableFlag =
      (this.#gif.logicalScreenDescriptor.packedField & 0x80) >> 7;
    if (globalColorTableFlag) {
      const globalColorTableSize =
        this.#gif.logicalScreenDescriptor.packedField & 0x07;
      const globalColorTableByteLength = 3 * 2 ** (globalColorTableSize + 1);
      this.#gif.globalColorTable = this.#readBytes(globalColorTableByteLength);
    }
  }

  // Extension blocks with image data
  #parseExtensionsWithImageData() {
    while (this.#position < this.buffer.length) {
      const blockId = this.#readByte();

      if (blockId === 0x21) {
        // 0x21 - extension introducer
        const controlLabel = this.#readByte();
        // graphic control extension
        if (controlLabel === 0xf9) {
          const gce = {
            blockSize: this.#readByte(),
            packed: this.#readByte(),
            delayTime: this.#readShort(),
            transparentColorIndex: this.#readByte(),
            terminator: this.#readByte(),
          };

          const imageBlockId = this.#readByte();

          if (imageBlockId === 0x2c) {
            // image descriptor
            const imageLeft = this.#readShort();
            const imageTop = this.#readShort();
            const imageWidth = this.#readShort();
            const imageHeight = this.#readShort();
            const packed = this.#readByte();
            const localColorTableFlag = (packed & 0x80) >> 7;
            const localColorTableSize = 2 ** ((packed & 0x07) + 1);

            let image = {
              globalControlExtension: gce,
              imageDescriptor: {
                imageLeft,
                imageTop,
                imageWidth,
                imageHeight,
                packed,
              },
            };

            if (localColorTableFlag) {
              image.localColorTable = this.#readBytes(localColorTableSize);
            }

            // image Data
            image.lzwMinCodeSize = this.#readByte();
            let imageData = "";
            while (true) {
              const blockSize = this.#readByte();
              if (blockSize === 0) break;
              imageData += this.#readString(blockSize);
            }
            image.data = imageData;
            this.#gif.frames.push(image);
          }
        } else {
          // other extensions
          while (true) {
            const blockSize = this.#readByte();
            if (blockSize === 0) break;
            this.#gif.extensions.push(this.#readBytes(blockSize));
          }
        }
      } else if (blockId === 0x3b) {
        // trailer
        break;
      } else {
        throw new Error("Unknown block type");
      }
    }
  }
}