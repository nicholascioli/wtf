// Julia Set Generator
// ----
// An interactive julia set fractal generator with customization options.
window.onload = async () => {
	// Set up the canvas
	let ctx = new wtf.Context({antialias: true, preserveDrawingBuffer: true});

	// Gather the shaders
	let shader = await wtf.ShaderProgram.fromUrl(ctx, "./vertex.glsl", "./fragment.glsl");

	// Gather the inputs
	let iter_input = document.getElementById("iteration_count");
	let cp_real_input = document.getElementById("cp_real");
	let cp_imag_input = document.getElementById("cp_imag");
	let cp_enable_input = document.getElementById("cp_enable");
	let power_input = document.getElementById("power");

	let center = [0, 0];
	let scale = 1.0;

	// Fix the size
	ctx.gl.canvas.width = ctx.gl.canvas.clientWidth;
	ctx.gl.canvas.height = ctx.gl.canvas.clientHeight;

	// Create the buffer for the positions
	let pos_buffer = new wtf.Buffer(ctx);

	// === Point Generation ===
	let points = [
		-1.0,  1.0,
		-1.0, -1.0,
		 1.0, -1.0,
		 1.0, -1.0,
		 1.0,  1.0,
		-1.0,  1.0
	];

	// Bind the data to the array
	pos_buffer.value = points;

	// Bind the buffer for use in rendering
	pos_buffer.bind();
	shader.attribs.pos.enable();

	// Allow for rendering
	window.render = () => {
		// Clear the screen
		ctx.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT);
		shader.use();

		// Set the uniforms
		shader.uniforms.iteration_count.value = Number(iter_input.value);

		// Complex parameters
		let cp_params = [
			Number(cp_real_input.value) || 0,
			Number(cp_imag_input.value) || 0,
			Number(cp_enable_input.checked) || 0
		];
		shader.uniforms.complex_parameter.value = cp_params;

		shader.uniforms.power.value = Number(power_input.value);

		shader.uniforms.ratio.value = ctx.gl.canvas.clientWidth / ctx.gl.canvas.clientHeight;
		shader.uniforms.screen_size.value = [ctx.gl.canvas.clientWidth, ctx.gl.canvas.clientHeight];
		shader.uniforms.center.value = center;
		shader.uniforms.scale.value = scale;

		// Set the resolution and draw the points
		ctx.gl.viewport(0, 0, ctx.gl.canvas.clientWidth, ctx.gl.canvas.clientHeight);
		ctx.gl.drawArrays(ctx.gl.TRIANGLES, 0, points.length / 2);
	}

	window.onkeydown = (ev) => {
		switch (ev.key) {
			case "ArrowRight":
				center[0] += 0.1;
				break;
			case "ArrowLeft":
				center[0] -= 0.1;
				break;
			case "ArrowDown":
				center[1] -= 0.1;
				break;
			case "ArrowUp":
				center[1] += 0.1;
				break;
			case "]":
				scale *= 1.5;
				center[0] += center[0] / 2.0;
				center[1] += center[1] / 2.0;
				break;
			case "[":
				scale /= 1.5;
				center[0] -= center[0] / 3;
				center[1] -= center[1] / 3;
				break;
			case "-":
				scale = 1.0;
				center = [0, 0];
				break;
		}

		// make sure no division by 0
		if (scale < 0.1) scale = 0.1;

		// Actually render the scene
		window.render();
	}

	// Mouse interactions
	let mouse_down = false;

	ctx.gl.canvas.onmousedown = () => {
		mouse_down = true;
	}
	ctx.gl.canvas.onmouseup = () => {
		mouse_down = false;
	}

	// Move with mouse
	ctx.gl.canvas.onmousemove = (ev) => {
		if (mouse_down) {
			center[0] -= ev.movementX / ctx.gl.canvas.clientWidth * 5;
			center[1] += ev.movementY / ctx.gl.canvas.clientHeight * 5;

			window.render();
		}
	}

	// Move with touch
	let last_touch = null;
	ctx.gl.canvas.ontouchstart = () => {
		mouse_down = true;
	}
	ctx.gl.canvas.ontouchend = () => {
		mouse_down = false;
	}
	ctx.gl.canvas.ontouchmove = (ev) => {
		if (!mouse_down) return;

		let touch = ev.targetTouches[0];

		if (last_touch) {
			center[0] -= (touch.pageX - last_touch.pageX) / ctx.gl.canvas.clientWidth * 5;
			center[1] += (touch.pageY - last_touch.pageY) / ctx.gl.canvas.clientHeight * 5;
		}

		last_touch = touch;

		window.render();
	}

	// Render the first time
	window.render();
}