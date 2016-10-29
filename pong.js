function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader,source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

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

	gl.deleteProgram(program);
}

var gl;

function drawPaddle() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.useProgram(this.program);

	gl.uniform2f(this.resloc, res[0], res[1]);
	gl.uniform4f(this.trans, this.posx, this.posy, 0, 0);
	gl.uniform4f(this.scale, this.scalex, this.scaley, 1, 1);
	gl.uniform4f(this.color, 1, 1, 1, 1);

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
	var myMinX = this.x;
	var myMinY = this.y + this.h;
	var myMaxX = this.x + this.w;
	var myMaxY = this.y;
	

	var oMinX = aabb.x;
	var oMinY = aabb.y + aabb.h;
	var oMaxX = aabb.x + aabb.w;
	var oMaxY = aabb.y;

	if (myMaxX < oMinX){
		return false;
	}
	if (myMinX > oMaxX){
		return false;
	}
	if (myMaxY > oMinY){
		return false;
	}
	if (myMinY < oMaxY){
		return false;
	}
	
	if (!this.owner.equals(aabb.owner)) { //don't collide with yourself
		return true;
	}

	return false;
}

function updateAabb(delta) {
	this.x = this.owner.posx - this.w/2;
	this.y =  this.owner.posy - this.w/2;

	for (var i = 0; i < aabbs.length; ++i) {
		if (this.intersects(aabbs[i])) {
			this.owner.handleCollision(aabbs[i].owner);
		}
	}

}

/*function centerToBottomLeft(ox, oy, w, h) {
	var me = {x:ox-w/2, y:oy-h/2};
	return me;
}

function bottomLeftToCenter(x,y, w, h) {
	return {x:x+w/2, y:y+h/2};
}*/

var UP_ARROW = 38;
var DOWN_ARROW = 40;
var LEFT_ARROW = 37;
var RIGHT_ARROW = 39;
var SPACE = 32;
var D_KEY = 68;

var TYPE_PADDLE = 0;
var TYPE_BALL = 1;
var TYPE_BOUND = 2;
var TYPE_VERT_BOUND = 3;

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
	var centerX = this.x + this.w/2;
	var centerY = this.y + this.h/2;
	gl.uniform4f(trans, centerX, centerY, 0, 0);
	gl.uniform4f(scale, this.owner.scalex, this.owner.scaley, 1, 1);
	gl.uniform4f(color, 0, 1, 0, 1);

	var positionloc = gl.getAttribLocation(aabb.program, "a_position");
	gl.enableVertexAttribArray(positionloc);
	gl.vertexAttribPointer(positionloc, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.LINE_STRIP, 0, this.modelPoints);

}

// owner is an object that contains these fields: posx, posy, scalex, scaley
function aabb(x ,y, w, h, owner, model) {
	var new_x = x - w/2;
	var new_y = y - h/2;

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

	aabbs.push(myInstance);

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

}

function handleCollisionBall(collider) {
	if (collider.type == TYPE_PADDLE) {
		this.speedx *= -1;
	} else if (collider.type == TYPE_BOUND) {
		this.speedy *= -1;
	} else if (collider.type == TYPE_VERT_BOUND) {
		this.speedx *= -1;
	}
}

function ball() {
	var ballBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ballBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(models["ball"]), gl.STATIC_DRAW);

	var vShaderSource = document.getElementById("vshader").text;
	var fShaderSource = document.getElementById("fshader").text;

	var vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
	var fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

	var program = createProgram(gl, vShader, fShader);


	var ballBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ballBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(models["ball"]), gl.STATIC_DRAW);

	ball.buffer = ballBuffer;
	ball.model = models["ball"];

	var vShaderSource = document.getElementById("vshader").text;
	var fShaderSource = document.getElementById("fshader").text;

	var vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
	var fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

	var program = createProgram(gl, vShader, fShader);

	ball.program = program;
	var myInstance = {
		posx:res[0],
		posy:res[1],
		scalex:50,
		scaley:50,
		speedx:-0.5,
		speedy:-0.3,
		buffer:ballBuffer,
		program:program,
		model:models["ball"],
		draw:drawBall,
		update:updateBall,
		handleCollision:handleCollisionBall,
		type:TYPE_BALL,
		equals:equalsGeneric,
		resloc:gl.getUniformLocation(program, "res"),
		trans:gl.getUniformLocation(program, "translation"),
		scale:gl.getUniformLocation(program, "scale"),
		color:gl.getUniformLocation(program, "uColor")
	};
	var myAabb = aabb(res[0]/2, res[1]/2, 1 * myInstance.scalex, 1 * myInstance.scaley, myInstance, models["ball"]);
	myInstance.aabb = myAabb;

	return myInstance;

}

function drawBall()  {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.useProgram(this.program);

	gl.uniform2f(this.resloc, res[0], res[1]);
	gl.uniform4f(this.trans, this.posx, this.posy, 0, 0);
	gl.uniform4f(this.scale, this.scalex, this.scaley, 1, 1);
	gl.uniform4f(this.color, 1, 1, 1, 1);

	var positionloc = gl.getAttribLocation(this.program, "a_position");
	gl.enableVertexAttribArray(positionloc);
	gl.vertexAttribPointer(positionloc, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	if (DRAW_AABB) {
		this.aabb.draw();
	}
}

var co = 0;
function updateBall (delta) {
	this.posx += this.speedx * delta;
	this.posy += this.speedy * delta;
	this.aabb.update(delta);
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

function handleCollisionPaddle(collider) {
	return;
}

function equalsGeneric(o) {
	if (this.type != o.type || this.posx != o.posx || this.posy != o.posy) {
		return false;
	}
	return true;
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
	var h = Math.abs(model[1] - model[5]);

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
		update:updatePaddle,
		handleCollision:handleCollisionPaddle,
		type:TYPE_PADDLE,
		equals:equalsGeneric,
		resloc:gl.getUniformLocation(paddleProgram, "res"),
		trans:gl.getUniformLocation(paddleProgram, "translation"),
		scale:gl.getUniformLocation(paddleProgram, "scale"),
		color:gl.getUniformLocation(paddleProgram, "uColor")
	};

	var myAabb = new aabb(posx, posy, w * myInstance.scalex, h * myInstance.scaley, myInstance, models["paddle"]); 

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

var lastTimeStamp;
var currentTimeStamp;
function tick() {
	currentTimeStamp = Date.now();
	var delta = currentTimeStamp - lastTimeStamp;
	update(delta);
	draw();
	lastTimeStamp = currentTimeStamp;
	requestAnimationFrame(tick);
}

function handleKeyDown(event) {

	if (event.keyCode == D_KEY) {
		DRAW_AABB = !DRAW_AABB;
	}

	keyState[event.keyCode] = true;
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
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleTouchMove(event) {
	mouseDown = true;
	mouseY = (canvasHeight - event.touches[0].clientY) * 2;
	mouseX = event.touches[0].clientX * 2;
}

function bound(x, y, w, h) {
	var myInstance = {
		x:x,
		y:y,
		w:w,
		h:h,
		scalex:w,
		scaley:h,
		handleCollision:function(){return},
		update:function(){return},
		equals:equalsGeneric,
		type:TYPE_BOUND,
		draw:function(){if (DRAW_AABB) this.aabb.draw();}
	};

	var myAabb = new aabb(x, y, w, h, myInstance, models["ball"]);
	myInstance.aabb = myAabb;
	
	gameObjects.push(myInstance);
	return myInstance;
}

function vertBound(x, y, w, h) {
	var myInstance = bound(x, y, w, h);
	myInstance.type = TYPE_VERT_BOUND;
	return  myInstance;
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
		
	models["ball"] = [-0.5, -0.5,
			0.5, -0.5,
			0.5, 0.5,
			0.5, 0.5,
			-0.5, 0.5,
			-0.5, -0.5];

	gl.clearColor(0, 0, 0, 1);
	var primitiveType = gl.TRIANGLES;
	resize();

	aabbSetUpStatic();

	gameObjects[0] = paddle();
	gameObjects[1] = new ball();

	var lowerBound = new bound(res[0], 0, 2 * res[0], 1);
	var upperBound = new bound(res[0], 2 * res[1], 2 * res[0], 1);
	var rightBound = new vertBound(2*res[0], 0, 1, 4 * res[1]);
	var leftBound = new vertBound(0, 0, 1, 4*res[1]);

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	document.onmousemove = handleMouseMove;
	document.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.ontouchmove = handleTouchMove;

	gl.lineWidth(3);

	alert("Click OK when ready!");
	lastTimeStamp = new Date().getTime();
	requestAnimationFrame(tick);
}
