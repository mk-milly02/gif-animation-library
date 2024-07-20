import "./gif.js";

class GIFEncoder {
    constructor(duration = 100) {
        this.frames = [];
        this.duration = duration;
    }

    addFrame(imageData) {
        this.frames.push(imageData);
    }

    createGif(callback) {
        const gifHeader = this._getGIFHeader();
        const logicalScreenDescriptor = this._getLogicalScreenDescriptor();
        const globalColorTable = this._getGlobalColorTable();
        const graphicControlExtension = this._getGraphicControlExtension();
        const imageDescriptor = this._getImageDescriptor();

        let gifData = gifHeader + logicalScreenDescriptor + globalColorTable;

        for (let i = 0; i < this.frames.length; i++) {
            gifData += graphicControlExtension + imageDescriptor + this._encodeImageData(this.frames[i]);
        }

        gifData += this._getGIFTrailer();

        const blob = new Blob([this._stringToUint8Array(gifData)], { type: 'image/gif' });
        callback(URL.createObjectURL(blob));
    }

    _getGIFHeader() {
        return "GIF89a";
    }

    _getLogicalScreenDescriptor() {
        const width = 320; // Example width
        const height = 240; // Example height
        const packed = 0b11110000; // Global Color Table Flag set
        const backgroundColorIndex = 0;
        const pixelAspectRatio = 0;
        return String.fromCharCode(width & 0xFF, (width >> 8) & 0xFF,
                                   height & 0xFF, (height >> 8) & 0xFF,
                                   packed, backgroundColorIndex, pixelAspectRatio);
    }

    _getGlobalColorTable() {
        // Example color table (256 colors, 3 bytes each)
        let colorTable = "";
        for (let i = 0; i < 256; i++) {
            colorTable += String.fromCharCode(i, i, i); // Greyscale color table
        }
        return colorTable;
    }

    _getGraphicControlExtension() {
        const packed = 0b00001000; // Disposal method
        return String.fromCharCode(0x21, 0xF9, 0x04, packed,
                                   this.duration & 0xFF, (this.duration >> 8) & 0xFF, 0, 0);
    }

    _getImageDescriptor() {
        const left = 0;
        const top = 0;
        const width = 320; // Example width
        const height = 240; // Example height
        const packed = 0; // No local color table, interlace, etc.
        return String.fromCharCode(0x2C, left & 0xFF, (left >> 8) & 0xFF,
                                   top & 0xFF, (top >> 8) & 0xFF,
                                   width & 0xFF, (width >> 8) & 0xFF,
                                   height & 0xFF, (height >> 8) & 0xFF,
                                   packed);
    }

    _encodeImageData(imageData) {
        // Simple example: use a fixed LZW minimum code size and trivial encoding
        const lzwMinCodeSize = 8;
        const imageDataBytes = String.fromCharCode(lzwMinCodeSize);

        // Here you would typically compress imageData using LZW encoding
        const imageDataBlock = imageDataBytes + String.fromCharCode(0x01, 0x01, 0x00);
        return imageDataBlock + String.fromCharCode(0x00);
    }

    _getGIFTrailer() {
        return String.fromCharCode(0x3B);
    }

    _stringToUint8Array(str) {
        const len = str.length;
        const array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            array[i] = str.charCodeAt(i);
        }
        return array;
    }
}

class GIFDecoder {
    constructor() {
        this.gif = new GIF();
    }

    decodeGif(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const gifData = new Uint8Array(event.target.result);
            this._parseGIF(gifData);
            callback(this.frames);
        };
        reader.readAsArrayBuffer(file);
    }

    _parseGIF(data) {
        // Basic GIF parsing logic to extract frames and metadata
        let position = 0;

        const readBytes = (length) => {
            const result = data.slice(position, position + length);
            position += length;
            return result;
        };

        const readByte = () => {
            return data[position++];
        };

        const readString = (length) => {
            let str = '';
            for (let i = 0; i < length; i++) {
                str += String.fromCharCode(readByte());
            }
            return str;
        };

        const readShort = () => {
            return readByte() + (readByte() << 8);
        };

        // Header
        const header = readString(6);
        if (header !== 'GIF87a' && header !== 'GIF89a') {
            this.gif.header = header
            throw new Error('Invalid GIF header');
        }

        // Logical Screen Descriptor
        const width = readShort();
        const height = readShort();
        const packed = readByte();
        const globalColorTableFlag = (packed & 0x80) >> 7;
        const colorResolution = (packed & 0x70) >> 4;
        const sortFlag = (packed & 0x08) >> 3;
        const globalColorTableSize = 2 ** ((packed & 0x07) + 1);
        const backgroundColorIndex = readByte();
        const pixelAspectRatio = readByte();

        // Global Color Table
        if (globalColorTableFlag) {
            readBytes(3 * globalColorTableSize);
        }

        while (position < data.length) {
            const blockId = readByte();

            if (blockId === 0x2C) {
                // Image Descriptor
                const imageLeft = readShort();
                const imageTop = readShort();
                const imageWidth = readShort();
                const imageHeight = readShort();
                const packed = readByte();
                const localColorTableFlag = (packed & 0x80) >> 7;
                const interlaceFlag = (packed & 0x40) >> 6;
                const sortFlag = (packed & 0x20) >> 5;
                const localColorTableSize = 2 ** ((packed & 0x07) + 1);

                if (localColorTableFlag) {
                    readBytes(3 * localColorTableSize);
                }

                // Image Data
                const lzwMinCodeSize = readByte();
                let imageData = '';
                while (true) {
                    const blockSize = readByte();
                    if (blockSize === 0) break;
                    imageData += readString(blockSize);
                }
                this.frames.push({ width, height, left: imageLeft, top: imageTop, imageData });
            } else if (blockId === 0x21) {
                // Extension Block
                const label = readByte();
                if (label === 0xF9) {
                    // Graphic Control Extension
                    const blockSize = readByte();
                    const packed = readByte();
                    const delayTime = readShort();
                    const transparentColorIndex = readByte();
                    const terminator = readByte();
                } else {
                    // Other extensions (e.g., Comment Extension, Application Extension)
                    while (true) {
                        const blockSize = readByte();
                        if (blockSize === 0) break;
                        readBytes(blockSize);
                    }
                }
            } else if (blockId === 0x3B) {
                // Trailer
                break;
            } else {
                throw new Error('Unknown block type');
            }
        }
    }
}

