/*
 * Copyright (c) 2010, Institute for Pervasive Computing, ETH Zurich.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the Institute nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE INSTITUTE AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE INSTITUTE OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file is part of the Copper CoAP Browser.
 */
/**
 * \file
 *         A wrapper for the different CoAP versions
 *
 * \author  Matthias Kovatsch <kovatsch@inf.ethz.ch>\author
 */

/*
 * Constants that must be present in all CoAP version modules
 * 
 * GET, POST, DELETE, SUBSCRIBE
 * WELL_KNOWN_RESOURCES
 * RESPONSE_TIMEOUT, MAX_RETRANSMIT
 */

function CoapMessage(method, ack, uri, pl) {
	this.packet = new CoapPacket();
	
	// creating a request, responses use parse()
	if (method!=null) {
		this.packet.code = method;
	}
	// should message be acknowledged
	if (ack) {
		this.packet.type = MSG_TYPE_CON;
	} else {
		this.packet.type = MSG_TYPE_NON;
	}
	// URI
	if (uri!=null) {
		this.setUri(uri);
	}
	// payload
	if (pl!=null) {
		this.setPayload(pl);
	}
}

CoapMessage.prototype = {
	packet : null,
	
	// message summary (e.g., for info/debug dumps)
	getSummary : function() {
		return 'Type: '+this.getType(true) + '\nCode: '+this.getCode(true) + '\nTransaction ID: '+this.getTID() + '\nOptions: '+this.getOptions() + '\nPayload: '+this.getPayload() + '\n------------------------\n';
	},
	
	// readable type
	getType : function(readable) {
		return this.packet.getType();
	},
	
	// readable method or response code
	getCode : function(readable) {
		return this.packet.getCode();
	},
	
	getTID : function() {
		return this.packet.tid;
	},
	setTID : function(id) {
		this.packet.tid = id;
	},

	// either through type or through ack field
	isConfirmable : function() {
		if (MSG_TYPE_CON!=null) {
			return this.packet.type==MSG_TYPE_CON;
		} else {
			return this.packet.ack==1;
		}
	},
	
	/*
	const OPTION_CONTENT_TYPE = 1;		const OPTION_CONTENT_TYPE = 1;		const OPTION_CONTENT_TYPE = 0;
	const OPTION_MAX_AGE = 2;			const OPTION_MAX_AGE = 2;			const OPTION_MAX_AGE = 3;
	const OPTION_PROXY_URI = 3;			
	const OPTION_ETAG = 4;				const OPTION_ETAG = 4;				const OPTION_ETAG = 4;
	const OPTION_URI_HOST = 5;			const OPTION_URI_AUTH = 5;			const OPTION_URI = 1;
	const OPTION_LOCATION_PATH = 6;		const OPTION_LOCATION = 6;		// for POST responses to indicate the location of created resource
	const OPTION_URI_PORT = 7;
	const OPTION_LOCATION_QUERY = 8;
	const OPTION_URI_PATH = 9;			const OPTION_URI_PATH = 9;			const OPTION_URI = 1;
										const OPTION_SUB_LIFETIME = 10;		const OPTION_SUB_LIFETIME = 6;
	const OPTION_TOKEN = 11;			const OPTION_TOKEN = 11;
	const OPTION_BLOCK = 13;			const OPTION_BLOCK = 13;
	const OPTION_NOOP = 14;				const OPTION_NOOP = 14;
	const OPTION_URI_QUERY = 15;		const OPTION_URI_QUERY = 15;		const OPTION_URI = 1;
	
																			const OPTION_URI_CODE = 2;
																			const OPTION_DATE = 5;
	*/
	
	// OPTION_CONTENT_TYPE:00+
	getContentType : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_CONTENT_TYPE);
		var opt = this.packet.getOption(OPTION_CONTENT_TYPE); // integer
		
		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Content-Type: ';
			// TODO: print readable content-type
			ret += opt;
			ret += '; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	
	// OPTION_MAX_AGE:00+
	getMaxAge : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_MAX_AGE);
		var opt = this.packet.getOption(OPTION_MAX_AGE); // integer

		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Max-Age: ';
			var time = opt;
			
			// split into weeks, days, hours, minutes, and seconds
			var s = time % 60;
			time = Math.floor(time/60);
			var m = time % 60;
			time = Math.floor(time/60);
			var h = time % 24;
			time = Math.floor(time/24);
			var d = time % 7;
			time = Math.floor(time/7);
			var w = time;
			
			var y = 0;
			if (w>104) var y = Math.round(1212424351/60.0/60.0/24.0/365.25*100.0)/100.0;
			
			// only print from largest unit onwards
			if (w) ret += w+'w ';
			if (w|d) ret += d+'d ';
			if (w|d|h) ret += h+'h ';
			if (w|d|h|m) ret += m+'m ';
			if (w|d|h|m|s) ret += s+'s ';
			if (y) ret += '(~'+y+'y) ';
			
			ret += '[int'+(optLen*8)+']; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	
	// OPTION_PROXY_URI:04+
	getProxyUri : function(readable) {
		
		if (coapVersion < 4) {
			if (readable) {
				return '';
			} else {
				return null;
			}
		}

		var optLen = this.packet.getOptionLength(OPTION_PROXY_URI);
		var opt = this.packet.getOption(OPTION_PROXY_URI); // string
		
		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Proxy-Uri: ';
			ret += opt;
			ret += ' [str,'+optLen+']; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	
	// OPTION_ETAG:00+
	getETag : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_ETAG);
		var opt = this.packet.getOption(OPTION_ETAG); // byte array

		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'ETag: ';
			
			ret += '0x';
			for (i in opt) {
				ret += opt[i].toString(16).toUpperCase();
			}
			ret +=  ' ['+optLen+' bytes]; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	
	// OPTION_URI_HOST:04+ / OPTION_URI_AUTH:03 / OPTION_URI:00
	getUriHost : function() {
		//TODO
	},
	// OPTION_URI_PORT:04+ / OPTION_URI:00
	getUriPort : function() {
		//TODO
	},
	// OPTION_URI_PATH:03+ / OPTION_URI:00
	getUriPath : function() {
		//TODO
	},
	// OPTION_URI_QUERY:03+ / OPTION_URI:00
	getUriQuery : function() {
		//TODO
	},
	// convenience function
	getUri : function(readable) {
		//TODO
		var optLen = 0;
		var opt = null;
		
		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Uri: ';
			ret += opt;
			ret += ' [str,'+optLen+']; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	setUri : function(uri) {
		this.packet.setUri(uri);
	},
	
	// OPTION_LOCATION_PATH:04+ / OPTION_LOCATION:03
	getLocationPath : function() {
		//TODO
	},
	// OPTION_LOCATION_QUERY:05+
	getLocationQuery : function() {
		//TODO
	},
	// convenience function
	getLocation : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_LOCATION_PATH);
		var opt = this.packet.getOption(OPTION_LOCATION_PATH); // string
		
		var opt2 = null;
		var optLen2 = 0;

		if (coapVersion >= 5) {
			if (this.packet.getOptionLength(OPTION_LOCATION_QUERY)) {
				opt += '?' + this.packet.getOption(OPTION_LOCATION_QUERY);
				optLen2 = this.packet.getOptionLength(OPTION_LOCATION_QUERY);
			}
		}
		
		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Location: ';
			if (opt.charAt(0)!='/') ret += '/';
			ret += opt;
			ret += ' [str,'+optLen+','+optLen2+']; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	
	// OPTION_TOKEN:03+
	getToken : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_TOKEN);
		var opt = this.packet.getOption(OPTION_TOKEN); // byte array

		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Token: ';
			
			ret += '0x';
			for (i in opt) {
				ret += opt[i].toString(16).toUpperCase();
			}
			ret += ' ['+optLen+' bytes]; ';
			
			return ret; 
		} else {
			return opt;
		}
	},
	
	// OPTION_BLOCK:03+
	getBlock : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_BLOCK);
		var opt = this.packet.getOption(OPTION_BLOCK); // integer

		if (readable) {
			if (optLen<=0) return '';
			
			var ret = 'Block: ';
		
			ret += this.getBlockNumber();
			if (this.getBlockMore()) ret += '+';
			ret += ' ['+this.getBlockSize()+' B/blk]; ';
			
			return ret;
		} else {
			return opt;
		}
	},
	setBlock : function(num, size) {
		var block = num << 4;
		var szx = 0;
		
		// check for power of two and correct size
		if (!isPowerOfTwo(size)) {
			dump('WARNING: CoapMessage.setBlock ['+size+' not a power of two; using next smaller power]\n');
		}
		if (size<16) {
			size = 16;
			dump('WARNING: CoapMessage.setBlock [block size must be >=16; using 16]\n');
		}
		if (size>2048) {
			size = 2048;
			dump('WARNING: CoapMessage.setBlock [block size must be <=2048; using 2048]\n');
		}
		
		size >>= 4;
		for (szx = 0; size; ++szx) size >>= 1;
		block |= szx - 1;
		
		this.packet.setOption(OPTION_BLOCK, block);
	},
	// convenience functions for block option parts
	getBlockNumber : function() {
		return (this.getBlock() >> 4);
	},
	getBlockSize : function() {
		return (16 << (0x07 & this.getBlock()));
	},
	getBlockMore : function() {
		return (0x08 & this.getBlock());
	},

	
	
	// readable options list
	getOptions : function() {
		var ret = '';

		ret += this.getContentType(true);
		ret += this.getMaxAge(true);
		ret += this.getProxyUri(true);
		ret += this.getETag(true);
		ret += this.getUri(true);
		ret += this.getLocation(true);
		ret += this.getToken(true);
		ret += this.getBlock(true);
		
		return ret;
	},
	// check if option is present
	isOption : function(optType) {
		var list = this.packet.getOptions();
		for (var i in list) {
			if (list[i]==optType) return true;
		}
		return false;
	},
	
	
	// payload functions
	getPayload : function() {
		return this.packet.payload;
	},
	setPayload : function(pl) {
		this.packet.payload = pl;
	},
	
	
	// convert message into datagram bytes
	serialize : function() {
		return this.packet.serialize();
	},
	
	// convert datagram bytes into message
	parse : function(datagram) {
		this.packet.parse(datagram);
	}
};
