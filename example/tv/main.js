window.onload = async () => {
	try {
		// Get the context and shader
		let ctx = new wtf.Context();
		ctx.gl.clearColor(0, 0, 0, 1);

		// Enable tests
		ctx.gl.enable(ctx.gl.DEPTH_TEST);
		ctx.gl.cullFace(ctx.gl.BACK);

		// Models
		let scene  = await wtf.Model.load_from_file("objs/scene.obj");
		let tv     = await wtf.Model.load_from_file("objs/tv.obj");
		let screen = await wtf.Model.load_from_file("objs/screen.obj");

		// Video
		window.vid = setup_video("video");

		// Shader passes
		let first_pass = await wtf.ShaderProgram.fromUrl(ctx, "simple.v.glsl", "simple.f.glsl");

		// Screen material
		let screen_mat = screen.get_material_for_context(ctx, "MirrorPart");

		// MVP
		let ratio = ctx.gl.canvas.clientWidth / ctx.gl.canvas.clientHeight;
		let eye = vec3(5, 4, 0);
		let view = lookAt(eye, vec3(0, 2, 0), vec3(0, 1, 0));
		let persp = perspective(60, ratio, 0.1, 100);
		let model = scalem(1, 1, 1);

		// Use the program
		first_pass.use();

		// Options for the model
		let mod_opts = {
			position: first_pass.attribs.pos,
			texture:  first_pass.attribs.uvs,
			normal:   first_pass.attribs.nor
		};

		first_pass.uniforms.texture = 0;
		let render = () => {
			// Clear and set shader
			ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);

			// Set MVP
			first_pass.uniforms.V.value = flatten(view);
			first_pass.uniforms.P.value = flatten(persp);

			// Draw the scene
			first_pass.uniforms.M.value = flatten(model);
			scene.draw(ctx, mod_opts);

			// Draw the TV
			tv.draw(ctx, mod_opts);

			// Copy the video frame
			if (copy_video) {
				screen_mat.value = vid;
			}

			// Draw the screen
			screen.draw(ctx, mod_opts);

			// Get ready for next frame
			window.requestAnimationFrame(render);
		};

		render();
	} catch (e) {
		console.error(e);
	}
};

let is_on = false;
let toggle_state = () => {
	if (is_on) {
		vid.currentTime = 0;
		vid.pause();

		is_on = false;
	} else {
		vid.play();

		is_on = true;
	}
}

let toggle_play = () => {
	if (!is_on) return;

	if (vid.paused) {
		vid.play();
	} else {
		vid.pause();
	}
}

let next = () => {
	if (!vid.paused) return;

	vid.currentTime += 1.0 / 24.0;
}

let prev = () => {
	if (!vid.paused) return;

	vid.currentTime -= 1.0 / 24.0;
}

let copy_video = false;
let setup_video = (url) => {
	const video = document.createElement('video');

	let playing = false;
	let timeupdate = false;
	let seeked = true;

	video.autoplay = false;
	video.muted = false;
	video.loop = true;

	// Waiting for these 2 events ensures
	// there is data in the video

	video.addEventListener('playing', function() {
		playing = true;
		checkReady();
	}, true);

	video.addEventListener('timeupdate', function() {
		timeupdate = true;
		checkReady();
	}, true);

	video.addEventListener("seeking", function() {
		seeked = false;
		checkReady();
	});

	video.addEventListener("seeked", function() {
		seeked = true;
		checkReady();
	});

	video.src = url;

	function checkReady() {
		if (playing && timeupdate && seeked) {
			copy_video = true;
		} else {
			copy_video = false;
		}
	}

	return video;
}