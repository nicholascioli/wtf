const FLOAT_SIZE = 4;

window.onload = async () => {
	// Get the characters
	let chars = await wtf.Model.load_from_file("char_normals.obj");
	let char_to_name = (chr) => "c" + chr.charCodeAt(0);

	// Get the base
	let base = await wtf.Model.load_from_file("base.obj");

	// Set up the environment
	let ctx = new wtf.Context({antialias: true, preserveDrawingBuffer: true});
	let gl = ctx.gl;

	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);

	// Fix the size
	gl.canvas.width  = gl.canvas.clientWidth;
	gl.canvas.height = gl.canvas.clientHeight;
	gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

	// MVP
	let ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
	let eye = vec3(1, 3, 1.5);
	let view = lookAt(eye, vec3(0, 1, 0), vec3(0, 1, 0));
	let persp = perspective(60, ratio, 0.1, 100);

	// Create the program
	let prog = await wtf.ShaderProgram.fromUrl(ctx, "./vertex.glsl", "./fragment.glsl");

	// Use the program
	prog.use();

	// Initial light position
	let light_pos = [2, 2, 2];
	let light_bounce = 0;

	// Extract the words to display (one word a second)
	let words = document.getElementById("words").textContent.replace(/[\n\t\r]/g, "").split(" ");
	let text = words.shift();
	setInterval(() => text = words.shift(), 1000);

	// Static object info
	let desk_angle = {x: -60, y: 0};
	let base_model = scalem(0.6, 0.6, 0.6);
	let desk_model = mult(
		translate(0, 1.5, 0),
		mult(
			mult(
				rotate(desk_angle.x, [1, 0, 0]),
				rotate(desk_angle.y, [0, 1, 0])
			),
			scalem(0.6, 0.6, 0.6)
		)
	);

	// Handle key events
	window.onkeydown = (ev) => {
		if (ev.key == "ArrowLeft") {
			desk_angle.y -= 5;
		} else if (ev.key == "ArrowRight") {
			desk_angle.y += 5;
		} else if (ev.key == "ArrowUp") {
			desk_angle.x -= 5;
		} else if (ev.key == "ArrowDown") {
			desk_angle.x += 5;
		}

		// Update the model
		desk_model = mult(
			translate(0, 1.5, 0),
			mult(
				mult(
					rotate(desk_angle.y, [0, 1, 0]),
					rotate(desk_angle.x, [1, 0, 0])
				),
				scalem(0.6, 0.6, 0.6)
			)
		);
	};

	// Options for the model
	let mod_opts = {
		position: prog.attribs.pos,
		normal: prog.attribs.nor
	};

	// Render Script
	let render = () => {
		if (text == undefined)
			text = "DONE";

		// Clear and set shader
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Set the light
		prog.uniforms.light_pos.value = light_pos;

		// Get relative center of the word
		let center = -1 / 2 * text.split("").reduce((acc, x) => acc + chars.bounds[char_to_name(x)].x.length, 0);

		prog.uniforms.V.value = flatten(view);
		prog.uniforms.P.value = flatten(persp);

		// Draw every letter
		for (let i = 0; i != text.length; ++i) {
			let model = mult(desk_model, mult(translate(center * 0.2, 0, 0.1 * 0.2), scalem(0.2, 0.2, 0.2)));
			let char = char_to_name(text[i]);

			prog.uniforms.color.value = [1.0, 1.0, 1.0];
			prog.uniforms.M.value = flatten(model);
			chars.draw(ctx, mod_opts, char);

			center +=
				0.5 * chars.bounds[char].x.length +
				0.5 * (i + 1 != text.length ? chars.bounds[char_to_name(text[i + 1])].x.length : 0) +
				0.1
			;
		}

		// Draw the base
		prog.uniforms.color.value = [34 / 255.0, 102 / 255.0, 102 / 255.0];
		prog.uniforms.M.value = flatten(base_model);
		base.draw(ctx, mod_opts, "Base");

		// Draw the desk
		prog.uniforms.color.value = [122 / 255.0, 159 / 255.0, 53 / 255.0];
		prog.uniforms.M.value = flatten(desk_model);
		base.draw(ctx, mod_opts, "Desk");

		window.requestAnimationFrame(render);

		// REMOVEME: Rotating light
		light_pos[0] = 1.5 * Math.sin(light_bounce);
		light_pos[2] = 1.5 * Math.cos(light_bounce);
		light_bounce += 0.01;
	};

	render();
};