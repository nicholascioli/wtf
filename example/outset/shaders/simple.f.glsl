precision mediump float;

uniform sampler2D texture;
uniform vec3 light_dir;

varying highp vec2 UV0;
varying vec3 Norm0;

void main() {
	vec3 norm = normalize(Norm0);
	float light = 2.0 * dot(norm, light_dir);

	gl_FragColor = texture2D(texture, UV0);
	// vec3 ambient = vec3(0.3) * gl_FragColor.rgb;

	// gl_FragColor.rgb = max(light * gl_FragColor.rgb, ambient);
}