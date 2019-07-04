

function makeInStream(in_fd) {
var stat = fs.fstatSync(in_fd);
var stream = {
	buffer: new Buffer(4096),
	totalPos: 0,
	pos: 0,
	end: 0,
	_fillBuffer: function() {
		this.end = fs.readSync(in_fd, this.buffer, 0, this.buffer.length);
		this.pos = 0;
	},
	readByte: function() {
		if (this.pos >= this.end) { this._fillBuffer(); }
		if (this.pos < this.end) {
			this.totalPos++;
			return this.buffer[this.pos++];
		}
		return -1;
	},
	read: function(buffer, bufOffset, length) {
		if (this.pos >= this.end) { this._fillBuffer(); }
		var bytesRead = 0;
		while (bytesRead < length && this.pos < this.end) {
			buffer[bufOffset++] = this.buffer[this.pos++];
			bytesRead++;
		}
		this.totalPos += bytesRead;
		return bytesRead;
	},
	eof: function() {
		if (this.pos >= this.end) { this._fillBuffer(); }
		return !(this.pos < this.end);
	}
};
if (stat.size) {
	stream.size = stat.size;
}
return stream;
};
