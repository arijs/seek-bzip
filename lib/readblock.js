
module.exports = function setupReadBlock(Bunzip) {

function makeOutStream(onFlush, bufSize) {
	return {
		buffer: new Buffer(bufSize || 4096),
		pos: 0,
		byteCount: 0,
		flush: function() {
			if (onFlush instanceof Function) {
				onFlush(new Buffer(this.buffer.slice(0, this.pos)));
			}
			this.pos = 0;
		},
		writeByte: function(byte) {
			if (this.pos >= this.buffer.length) {
				this.flush();
			}
			this.buffer[this.pos++] = byte;
			this.byteCount++;
		}
	};
}

function initBlockOpt() {
	return {
		fileCount: 0,
		fileOffset: 0,
		byteOffset: 4,
		bytesInput: 0,
		bytesOutput: 0,
		bitOffset: 0,
		bitOffsetEnd: 0,
		blockCount: 0,
		blockCRC: 0,
		streamPartialCRC: 0,
		streamCRC: 0,
		swrite: null
	};
}

function readBlock(fd, opt, onData, bufSize) {
	opt = opt || initBlockOpt();
	var sread = Bunzip.fdReadStream(fd, bufSize);
	sread.seek(opt.fileOffset);
	var writeTotal = 0;
	var bytesRead = 0;
	var swrite = makeOutStream(onData, bufSize);
	var bz = new Bunzip(sread, swrite);
	bz.streamCRC = opt.streamPartialCRC || 0;
	var start = opt.fileOffset + opt.byteOffset;
	bz.reader.seek(start, opt.bitOffset);
  var moreBlocks = bz._init_block();
  if (moreBlocks) {
    /* Zero this so the current byte from before the seek is not written */
    bz.writeCopies = 0;

    /* Decompress the block and write to stdout */
    bz._read_bunzip();
		bytesRead = sread.byteCount;

		return {
			fileCount: opt.fileCount,
			fileOffset: opt.fileOffset,
			byteOffset: start - opt.fileOffset + bytesRead - (bz.reader.bitOffset ? 1 : 0),
			bytesInput: bytesRead,
			bytesOutput: swrite.byteCount,
			bitOffset: bz.reader.bitOffset,
			bitOffsetEnd: 0,
			blockCount: opt.blockCount + 1,
			blockCRC: bz.targetBlockCRC,
			streamPartialCRC: bz.streamCRC,
			streamCRC: 0,
			swrite: swrite
		};
  } else {
		var targetStreamCRC = bz.reader.read(32) >>> 0; // (convert to unsigned)
		if (targetStreamCRC !== bz.streamCRC) {
			throw new Error(
				"Bzip2 error: Bad stream CRC "+
				"(got "+bz.streamCRC.toString(16)+
				" expected "+targetStreamCRC.toString(16)+")"
			);
		}
		bytesRead = sread.byteCount;
		return {
			fileCount: opt.fileCount + 1,
			fileOffset: start + bytesRead,
			byteOffset: 4,
			bytesInput: bytesRead,
			bytesOutput: 0,
			bitOffset: 0,
			bitOffsetEnd: bz.reader.bitOffset,
			blockCount: 0,
			blockCRC: 0,
			streamPartialCRC: 0,
			streamCRC: bz.streamCRC,
			swrite: swrite
		};
	}

}

readBlock.initOpt = initBlockOpt;
readBlock.makeOutStream = makeOutStream;

Bunzip.readBlock = readBlock;

};
