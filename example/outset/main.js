window.onload = async () => {
	try {
		// Play background music indefinitely
		let bgm = setup_bgm("./bgm.mp3");

		// Get the context and shader
		let ctx = new wtf.Context({
			antialias: true
		});
		ctx.gl.clearColor(0, 0, 0, 1);

		// Enable tests
		ctx.gl.enable(ctx.gl.DEPTH_TEST);
		ctx.gl.enable(ctx.gl.BLEND);
		ctx.gl.blendFunc(ctx.gl.SRC_ALPHA, ctx.gl.ONE_MINUS_SRC_ALPHA);
		ctx.gl.cullFace(ctx.gl.BACK);

		// Env map
		let env = new wtf.CubeMap({
			pos_x: "textures/env_map/miramar_ft.png",
			pos_y: "textures/env_map/miramar_up.png",
			pos_z: "textures/env_map/miramar_rt.png",

			neg_x: "textures/env_map/miramar_bk.png",
			neg_y: "textures/env_map/miramar_dn.png",
			neg_z: "textures/env_map/miramar_lf.png"
		});

		// Models
		let island = await wtf.Model.load_from_file("objs/outset.obj");
		let lights = await wtf.Model.load_from_file("objs/window_lights.obj");
		let ocean  = await wtf.Model.load_from_file("objs/ocean.obj");

		// Shaders
		let simple = await wtf.ShaderProgram.fromUrl(ctx, "shaders/simple.v.glsl", "shaders/simple.f.glsl");
		let water  = await wtf.ShaderProgram.fromUrl(ctx, "shaders/simple.v.glsl", "shaders/water.f.glsl");

		// Extra materials
		let distort = new wtf.Material(ctx, {
			color: [1, 1, 1],
			url: "./textures/distort.png"
		});
		let flow = new wtf.Material(ctx, {
			color: [1, 1, 1],
			url: "./textures/flow.png"
		});

		// MVP
		let ratio = ctx.gl.canvas.clientWidth / ctx.gl.canvas.clientHeight;
		let eye = vec3(0, 0.2, -5);
		let view = lookAt(eye, vec3(0, 2, 0), vec3(0, 1, 0));
		let persp = perspective(60, ratio, 0.1, 100);
		let model = scalem(1, 1, 1);

		// Set the shader properties
		simple.use();
		simple.uniforms.InverseM.value = flatten(transpose(inverse(model)));
		simple.uniforms.light_dir.value = flatten(normalize(vec3(-0.5, -0.5, -0.5)));

		water.use();
		water.uniforms.InverseM.value = flatten(transpose(inverse(model)));
		water.uniforms.light_dir.value = flatten(normalize(vec3(-0.5, -0.5, -0.5)));
		water.uniforms.distort.value = 1;
		water.uniforms.water_distort.value = 0.005;

		// Bind distortion texture
		distort.bind(ctx.gl.TEXTURE1);

		// Options for the model
		let mod_opts = {
			position: simple.attribs.pos,
			texture:  simple.attribs.uvs,
			normal:   simple.attribs.nor
		};

		// Handle keypresses
		let at = [0, 0.2, -3, 1];
		let angle = [0.0, 0.0];
		let inverse_vp = inverse(mult(persp, view));
		window.onkeydown = (ev) => {
			let delta = 0.05;
			let forward = vec4(0, 0, delta, 1);
			let move = 0;

			if (ev.key == "ArrowLeft")
				angle[0] += 7;
			else if (ev.key == "ArrowRight")
				angle[0] -= 7;
			else if (ev.key == "ArrowDown")
				move = -1;
			else if (ev.key == "ArrowUp")
				move = 1;
			else if (ev.key == "w")
				angle[1] += 7;
			else if (ev.key == "s")
				angle[1] -= 7;
			else if (ev.key == "1") {
				water.use();
				water.uniforms.water_distort.value = 0.005;
				distort.bind(ctx.gl.TEXTURE1);
				return;
			} else if (ev.key == "2") {
				water.use();
				water.uniforms.water_distort.value = 0.01;
				flow.bind(ctx.gl.TEXTURE1);
				return;
			}
			else
				return;


			// Get new position for eye
			let new_forward = mult(
				forward,
				mult(
					rotate(angle[1], [1, 0, 0]),
					rotate(angle[0], [0, 1, 0])
				)
			);

			// Move if necessary
			if (move != 0)
				at = move > 0 ? add(at, new_forward) : subtract(at, new_forward);
			new_forward = add(at, new_forward);

			// Set the view
			view = lookAt(vec3(...at), vec3(...new_forward), vec3(0, 1, 0));

			// We only care about direciton so remove the translation
			let true_view = mult(scalem(1, 1, 1), view);
			true_view[0][3] = 0;
			true_view[1][3] = 0;
			true_view[2][3] = 0;

			inverse_vp = inverse(mult(persp, true_view));
		}

		// Render loop
		let time = 0;
		let old = Date.now();
		let render = () => {
			// update time
			let now = Date.now();
			time += 0.00005 * (now - old);
			old = now;

			// Clear and set shader
			ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);

			// Set MVP
			simple.use();
			simple.uniforms.V.value = flatten(view);
			simple.uniforms.P.value = flatten(persp);
			simple.uniforms.M.value = flatten(model);

			// SkyBox
			env.draw(ctx, flatten(inverse_vp));

			// Draw the ocean
			water.use();
			water.uniforms.V.value = flatten(view);
			water.uniforms.P.value = flatten(persp);
			water.uniforms.M.value = flatten(model);
			water.uniforms.time_elapsed.value = time;
			ocean.draw(ctx, mod_opts);

			// The island
			simple.use();
			island.draw(ctx, mod_opts);

			// Get ready for next frame
			window.requestAnimationFrame(render);
		};

		render();
	} catch (e) {
		console.error(e.message);
	}
}

function setup_bgm(path) {
	let vid = document.createElement("video");

	// vid.autoplay = true;
	vid.muted = false;
	vid.loop = true;

	vid.src = path;

	// vid.play();
}