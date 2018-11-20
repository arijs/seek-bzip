var fs = require('fs');

function makeInStream(in_fd, bufSize) {
	var stat = fs.fstatSync(in_fd);
	var stream = {
		buffer: new Buffer(bufSize || 4096),
		filePos: null,
		totalPos: 0,
		byteCount: 0,
		pos: 0,
		end: 0,
		_fillBuffer: function() {
			this.end = fs.readSync(
				in_fd,
				this.buffer,
				0,
				this.buffer.length,
				this.filePos
			);
			this.pos = 0;
			if (this.filePos !== null && this.end > 0) {
				this.filePos += this.end;
			}
		},
		readByte: function() {
			if (this.pos >= this.end) {
				this._fillBuffer();
			}
			if (this.pos < this.end) {
				this.totalPos++;
				this.byteCount++;
				return this.buffer[this.pos++];
			}
			return -1;
		},
		read: function(buffer, bufOffset, length) {
			if (this.pos >= this.end) {
				this._fillBuffer();
			}
			var bytesRead = 0;
			while (bytesRead < length && this.pos < this.end) {
				buffer[bufOffset++] = this.buffer[this.pos++];
				bytesRead++;
			}
			this.totalPos += bytesRead;
			return bytesRead;
		},
		seek: function(seek_pos) {
			this.filePos = seek_pos;
			this.pos = this.end = 0;
		},
		eof: function() {
			if (this.pos >= this.end) {
				this._fillBuffer();
			}
			return !(this.pos < this.end);
		}
	};
	if (stat.size) {
		stream.size = stat.size;
	}
	return stream;
}

module.exports = makeInStream;
