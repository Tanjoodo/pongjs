function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader,source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	//console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	//console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

var gl;

function drawPaddle() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.useProgram(this.program);
	var resloc = gl.getUniformLocation(this.program, "res");
	var trans = gl.getUniformLocation(this.program, "translation");
	var scale = gl.getUniformLocation(this.program, "scale");
	var color = gl.getUniformLocation(this.program, "uColor");

	gl.uniform2f(resloc, res[0], res[1]);
	gl.uniform4f(trans, this.posx, this.posy, 0, 0);
	gl.uniform4f(scale, this.scalex, this.scaley, 1, 1);
	gl.uniform4f(color, 1, 1, 1, 1);

	var positionloc = gl.getAttribLocation(this.program, "a_position");
	gl.enableVertexAttribArray(positionloc);
	gl.vertexAttribPointer(positionloc, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	if (DRAW_AABB) {
		this.aabb.draw();
	}
}

// magic code from another pong project
function aabbIntersects(aabb)
{
	if ((this.x >= aabb.x) && (this.x <= aabb.x + aabb.w))
	{
		if ((this.y >= aabb.y) && (this.y <= aabb.y + aabb.h))
			return true;
	}

	if ((this.x + this.w >= aabb.x) 
		&& ((this.x + this.w) <= (aabb.x + aabb.w + this.w)))
	{
		if ((this.y + this.h >= aabb.y) && (this.y + this.h <= aabb.y + aabb.h + this.h))
			return true;
	}
	return false;
}

function updateAabb(delta) {
	this.x = this.owner.posx;
	this.y = this.owner.posy;
}

function centerToBottomLeft(x, y, w, h) {
	return {x:x-w/2, y:y-h/2};
}

function bottomLeftToCenter(x,y, w, h) {
	return {x:x+w/2, y:y+h/2};
}

var UP_ARROW = 38;
var DOWN_ARROW = 40;
var LEFT_ARROW = 37;
var RIGHT_ARROW = 39;

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;

var DRAW_AABB = false;
var aabbs = [];

var gameObjects = [];
var models = [];
var keyState = [];
var paddleTransY = 55;
var paddleSpeedY = 120;
var paddleBuffer;
var res;

var deltas = [];
var di = 0;

var canvasWidth;
var canvasHeight;

var testAabb;
var testPaddle;

function drawAabb() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.useProgram(aabb.program);
	var resloc = gl.getUniformLocation(aabb.program, "res");
	var trans = gl.getUniformLocation(aabb.program, "translation");
	var scale = gl.getUniformLocation(aabb.program, "scale");
	var color = gl.getUniformLocation(aabb.program, "uColor");

	gl.uniform2f(resloc, res[0], res[1]);
	var centerPoint = bottomLeftToCenter(this.x, this.y, this.w, this.h);
	gl.uniform4f(trans, centerPoint.x, centerPoint.y, 0, 0);
	gl.uniform4f(scale, this.owner.scalex, this.owner.scaley, 1, 1);
	gl.uniform4f(color, 0, 1, 0, 1);

	var positionloc = gl.getAttribLocation(aabb.program, "a_position");
	gl.enableVertexAttribArray(positionloc);
	gl.vertexAttribPointer(positionloc, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.LINE_STRIP, 0, this.modelPoints);
	//console.log(this.x, this.y);

}

// owner is an object that contains these fields: posx, posy, scalex, scaley
function aabb(x ,y, w, h, owner, model) {
	var bottomLeft = centerToBottomLeft(x, y, w, h);
	var new_x = bottomLeft.x;
	var new_y = bottomLeft.y;

	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	var points = model;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

	var myInstance = {
		x:new_x,
		y:new_y,
		w:w,
		h:h,
		buffer:buffer,
		owner:owner,
		update:updateAabb,
		draw:drawAabb,
		intersects:aabbIntersects,
		modelPoints:points.length/2
	};
	gameObjects.push(myInstance);

	return myInstance;
}

// shader program can be set up statically to be used by all instances. Called once in start()
function aabbSetUpStatic() {
	var vShaderSource = document.getElementById("vshader").text;
	var fShaderSource = document.getElementById("fshader").text;

	var vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
	var fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

	var program = createProgram(gl, vShader, fShader);

	aabb.program = program;
	//console.log(aabb.program);

}

function updatePaddle(delta) {
	if (keyState[UP_ARROW] == true) {
		this.speedy = 100/60.0;
	} else if (keyState[DOWN_ARROW] == true) {
		this.speedy = -100/60.0;
	} else if (keyState[UP_ARROW] == false || keyState[DOWN_ARROW] == true) {
		this.speedy = 0;
	}
	this.posx += this.speedx * delta;
	this.posy += this.speedy * delta;
	deltas[++di%10] = delta;
	 
	if (mouseDown) {
		this.posy = mouseY;
	}

	this.aabb.update(delta);
	
}

function UpdatePaddleTouch() {
	this.posy = mouseY;
}

function paddle() {
	paddleBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, paddleBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(models["paddle"]), gl.STATIC_DRAW);

	var vertexShaderSource = document.getElementById("vshader").text;
	var fragmentShaderSource = document.getElementById("fshader").text;

	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	var paddleProgram = createProgram(gl, vertexShader, fragmentShader);

	var posx = 30;
	var posy = 0;
	var model = models["paddle"];
	var w = Math.abs(model[0] - model[2]);
	var h = Math.abs(model[1] - model[3]);

	myInstance = {
		posx:posx,
		speedx:0,
		speedy:0,
		posy:posy,
		scaley:50,
		scalex:50,
		buffer:paddleBuffer,
		program:paddleProgram,
		draw:drawPaddle,
		update:updatePaddle
	};

	var myAabb = new aabb(posx, posy, w, h, myInstance, models["paddle"]); 

	myInstance.aabb = myAabb;

	return myInstance;

}


function resize() {
	var canvas = document.getElementById("c");
	canvasWidth = canvas.clientWidth;
	canvasHeight = canvas.clientHeight;
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	gl.viewport(0, 0, canvasWidth, canvasHeight);
	res = [canvasWidth, canvasHeight];
}

function draw() {
	resize();
	gl.clear(gl.COLOR_BUFFER_BIT);
	for (i = 0; i < gameObjects.length; ++i) {
		gameObjects[i].draw();
	}
}

function update(delta) {
	for (i = 0; i < gameObjects.length; ++i) {
		gameObjects[i].update(delta);
	}
}

var lastTimeStamp = new Date().getTime();
function tick() {
	currentTimeStamp = new Date().getTime();
	var delta = currentTimeStamp - lastTimeStamp;
	update(delta);
	draw();
	lastTimeStamp = currentTimeStamp;
	requestAnimationFrame(tick);
}

function handleKeyDown(event) {
	keyState[event.keyCode] = true;
	//if (event.keyCode == RIGHT_ARROW) console.log(deltas);
}

function handleKeyUp(event) {
	keyState[event.keyCode] = false;
}

function handleMouseMove(event) {
	mouseX = event.clientX * 2;
	mouseY = (canvasHeight - event.clientY) * 2;
}

function handleMouseDown(event) {
	mouseDown = true;
	//console.log(mouseY);
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleTouchMove(event) {
	mouseDown = true;
	mouseY = (canvasHeight - event.touches[0].clientY) * 2;
	mouseX = event.touches[0].clientX * 2;
}

function start() {
	var canvas = document.getElementById("c");
	gl = canvas.getContext("webgl");
	if (!gl) {
		alert("u haff no gl");
	}
	
	models["paddle"] = [-0.3, -1.5,
	                    0.3, -1.5,
	                    0.3, 1.5,
	                    0.3, 1.5,
	                    -0.3, 1.5,
			    -0.3, -1.5,];
		

	gl.clearColor(0, 0, 0, 1);
	var primitiveType = gl.TRIANGLES;
	gameObjects[0] = paddle();

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	document.onmousemove = handleMouseMove;
	document.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.ontouchmove = handleTouchMove;

	resize();
	//console.log(canvasHeight);
	aabbSetUpStatic();
	gl.lineWidth(3);

	requestAnimationFrame(tick);

}
