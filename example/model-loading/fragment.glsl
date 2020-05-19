precision mediump float;
uniform vec3 color;

varying vec3 Pos0;
varying vec3 Norm0;
varying vec3 Light0;

vec4 blinn(vec3 color) {
	float AMBIENT = 0.3;

	float dist = length(Light0 - Pos0);
	vec3 light_dir = normalize(Light0 - Pos0);

	float diffuse = clamp(dot(Norm0, light_dir), 0.0, 1.0);

	// Specularity
	vec3 view_dir = normalize(-Pos0);
	vec3 half_dir = normalize(light_dir + view_dir);

	float specular_angle = max(dot(half_dir, Norm0), 0.0);
	float specular = specular_angle * specular_angle;

	float dist2 = dist * dist;

	return vec4(
		AMBIENT * color +
		2.0 * diffuse * color / dist2 +
		color * specular * 2.0 / dist2,
		1.0
	);
}

void main() {
	gl_FragColor = blinn(color);
}