
function searchHexString(hexString, bz, bzRead, opt) {
	opt || (opt = {});
	var len = hexString.length;
	var lbytesSearch = Math.ceil(len * 0.5);
	var lbytes = lbytesSearch * (opt.searchMult || 1);
	var startBit = bz.reader.bitOffset;
	var filePos = bzRead.filePos;
	var bzPos = bzRead.pos;
	var bzEnd = bzRead.end;
	var bzStart = filePos - bzEnd;
	var attempts = [];
	for (var bit = 0; bit < 8; bit++) {
		var bitAtt = [];
		bz.reader.seek(bzStart, bit);
		var remain = bzRead.end - 1;//(bit ? 1 : 0);
		var getSubstr = function() {
			var n = Math.min(lbytes, remain);
			var s = n > 0 ? bz.reader.readBytes(n).toString('hex') : '';
			remain -= n > 0 ? n : 0;
			return s;
		}
		var fstart = remain;
		var start1 = 0;
		var prev;
		opt.onBitStart && opt.onBitStart(bit);
		var next = getSubstr();
		var spos = lbytes;
		var cut = 0;
		var start2 = fstart - remain;
		do {
			prev = next;
			next = getSubstr();
			var ix = String(prev+next).indexOf(hexString);
			var res = {
				ix: ix,
				p: prev,
				n: next,
				c: cut,
				s1: start1,
				s2: start2,
				o: ix == -1 ? ix : ix * 0.5 + start1,
				fs: fstart,
				r: remain
			};
			if (ix != -1) {
				opt.onFound && opt.onFound(res, bit);
				bitAtt.push(res);
			}
			opt.onSearch && opt.onSearch(res, bit);
			cut++;
			start1 = start2;
			start2 = fstart - remain;
		} while (remain > 0);
		attempts.push(bitAtt);
	}
	bz.reader.seek(filePos - bzEnd + bzPos, startBit);
	return attempts;
}

module.exports = searchHexString;
