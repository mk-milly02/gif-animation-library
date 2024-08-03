export class GIF {
  header;
  logicalScreenDescriptor = {
    canvasWidth: [],
    canvasHeight: [],
    packedField: [],
    backgroundColorIndex: [],
    pixelAspectRatio: [],
  };
  globalColorTable;
  frames = []; // images
  extensions = []; // (e.g., Comment Extension, Application Extension, Plain Text Extension)
  trailer;
}

export class Decoder {
  #gif = new GIF();
  #position = 0;

  constructor(buffer) {
    this.buffer = new Uint8Array(buffer);
  }

  decode() {
    this.#parseHeader();
    this.#parseLogicalScreenDescriptor();
    this.#parseGlobalColorTable();
    this.#parseData();
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
    var enc = new TextEncoder();
    this.#gif.header = enc.encode(header);
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
  #parseData() {
    while (this.#position < this.buffer.length) {
      const blockId = this.#readByte();

      if (blockId === 0x21) { // 0x21 - extension introducer
        const controlLabel = this.#readByte();
        
        if (controlLabel === 0xf9) { // graphic control extension
          const gce = {
            blockId: blockId,
            controlLabel: controlLabel,
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
                imageBlockId,
                imageLeft,
                imageTop,
                imageWidth,
                imageHeight,
                packed,
              },
              hasLCT: localColorTableFlag,
            };

            if (localColorTableFlag) {
              image.localColorTable = this.#readBytes(localColorTableSize);
            }

            // image data
            let data = [this.#readByte()]; // lsw
            while (true) {
              const blockSize = this.#readByte();
              data.push(blockSize);
              if (blockSize === 0) break;
              const d = this.#readBytes(blockSize);
              for (let index = 0; index < d.length; index++) {
                data.push(d[index]);
              }
            }
            image.data = new Uint8Array(data);
            this.#gif.frames.push(image);
          }
        } else {
          // other extensions
          let extension = [blockId, controlLabel];
          while (true) {
            const blockSize = this.#readByte();
            extension.push(blockSize);
            if (blockSize === 0) break;
            const ext = this.#readBytes(blockSize);
            for (let index = 0; index < ext.length; index++) {
                extension.push(ext[index]);  
            }
          }
          this.#gif.extensions.push(new Uint8Array(extension));
        }
      } else if (blockId === 0x3b) {
        // trailer
        this.#gif.trailer = blockId;
        break;
      } else {
        throw new Error("Unknown block type");
      }
    }
  }
}

export class Encoder {
  constructor(gif) {
    this.gif = gif;
  }

  async encode() {
    let gifData = [];

    gifData.push(this.gif.header);
    gifData.push(this.#getLogicalScreenDescriptor());
    gifData.push(this.gif.globalColorTable);
    gifData.push(this.gif.extensions);

    for (let i = 0; i < this.gif.frames.length; i++) {
      gifData.push(this.#getGlobalControlExtension(i));
      gifData.push(this.#getImageDescriptor(i));
      if (this.gif.frames[i].hasLCT) {
        gifData.push(this.gif.frames[i].localColorTable);
      }
      gifData.push(this.gif.frames[i].data);
    }

    gifData.push(new Uint8Array([this.gif.trailer]));

    const x = gifData.join(",");
    const y = x.split(",");

    const encodedGIF = new Uint8Array(y);

    console.log(encodedGIF);

    const blob = new Blob([encodedGIF]);
    return URL.createObjectURL(blob);
  }

  #getLogicalScreenDescriptor() {
    return new Uint8Array([
      this.gif.logicalScreenDescriptor.canvasWidth & 0xff,
      this.gif.logicalScreenDescriptor.canvasWidth >> 8,
      this.gif.logicalScreenDescriptor.canvasHeight & 0xff,
      this.gif.logicalScreenDescriptor.canvasHeight >> 8,
      this.gif.logicalScreenDescriptor.packedField,
      this.gif.logicalScreenDescriptor.backgroundColorIndex,
      this.gif.logicalScreenDescriptor.pixelAspectRatio,
    ]);
  }

  #getGlobalControlExtension(i) {
    return new Uint8Array([
      this.gif.frames[i].globalControlExtension.blockId,
      this.gif.frames[i].globalControlExtension.controlLabel,
      this.gif.frames[i].globalControlExtension.blockSize,
      this.gif.frames[i].globalControlExtension.packed,
      this.gif.frames[i].globalControlExtension.delayTime & 0xff,
      this.gif.frames[i].globalControlExtension.delayTime >> 8,
      this.gif.frames[i].globalControlExtension.transparentColorIndex,
      this.gif.frames[i].globalControlExtension.terminator,
    ]);
  }

  #getImageDescriptor(i) {
    return new Uint8Array([
      this.gif.frames[i].imageDescriptor.imageBlockId,
      this.gif.frames[i].imageDescriptor.imageLeft & 0xff,
      this.gif.frames[i].imageDescriptor.imageLeft >> 8,
      this.gif.frames[i].imageDescriptor.imageTop & 0xff,
      this.gif.frames[i].imageDescriptor.imageTop >> 8,
      this.gif.frames[i].imageDescriptor.imageWidth & 0xff,
      this.gif.frames[i].imageDescriptor.imageWidth >> 8,
      this.gif.frames[i].imageDescriptor.imageHeight & 0xff,
      this.gif.frames[i].imageDescriptor.imageHeight >> 8,
      this.gif.frames[i].imageDescriptor.packed,
    ]);
  }
}

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
