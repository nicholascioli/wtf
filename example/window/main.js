window.onload = async () => {
	try {
		// Get the context and shader
		let ctx = new wtf.Context({
			antialias: true
		});
		ctx.gl.clearColor(0.01837, 0.7237, 0.8140, 1);

		// Enable tests
		ctx.gl.enable(ctx.gl.DEPTH_TEST);
		ctx.gl.enable(ctx.gl.BLEND);
		ctx.gl.blendFunc(ctx.gl.SRC_ALPHA, ctx.gl.ONE_MINUS_SRC_ALPHA);
		ctx.gl.cullFace(ctx.gl.BACK);

		// Models
		let scene  = await wtf.Model.load_from_file("objs/room.obj");

		// Shaders
		let simple = await wtf.ShaderProgram.fromUrl(ctx, "simple.v.glsl", "simple.f.glsl");

		// Grab the material for the glass
		let glass = scene.get_material_for_context(ctx, "MAT_MODEL_glass");
		glass.color[3] *= 0.3;

		// MVP
		let ratio = ctx.gl.canvas.clientWidth / ctx.gl.canvas.clientHeight;
		let eye = vec3(0, 1.5, -3);
		let view = lookAt(eye, vec3(0, 1.5, 0), vec3(0, 1, 0));
		let persp = perspective(60, ratio, 0.1, 100);
		let model = scalem(1, 1, 1);

		// Use the program
		simple.use();

		// Set the shader properties
		simple.uniforms.InverseM.value = flatten(transpose(inverse(model)));
		simple.uniforms.light_dir.value = flatten(normalize(vec3(-0.5, -0.5, -0.5)));

		// Options for the model
		let mod_opts = {
			position: simple.attribs.pos,
			texture:  simple.attribs.uvs,
			normal:   simple.attribs.nor
		};
		simple.uniforms.texture = 0;

		// Handle keypresses
		let at = [0, 1.5, -3];
		window.onkeydown = (ev) => {
			let delta = 0.15;
			switch (ev.key) {
				case "ArrowLeft":
					at[0] += delta;
					break;
				case "ArrowRight":
					at[0] -= delta;
					break;
				case "ArrowDown":
					at[1] -= delta;
					break;
				case "ArrowUp":
					at[1] += delta;
					break;
			}

			let clamp = (val, min, max) => {
				if (val < min) return min;
				if (val > max) return max;

				return val;
			};

			// Clamp the values
			at[0] = clamp(at[0], -1, 1);
			at[1] = clamp(at[1], 0.85, 2.0);

			// Set the view
			view = lookAt(vec3(at[0], at[1], at[2]), vec3(0, 1.5, 0), vec3(0, 1, 0));

			console.log(at);
		}

		// Render loop
		let render = () => {
			// Clear and set shader
			ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);

			// Set MVP
			simple.uniforms.V.value = flatten(view);
			simple.uniforms.P.value = flatten(persp);

			// Draw the scene
			simple.uniforms.M.value = flatten(model);
			scene.draw(ctx, mod_opts);

			// Get ready for next frame
			window.requestAnimationFrame(render);
		};

		render();
	} catch (e) {
		console.error(e);
	}
}