attribute vec3 pos;
attribute vec3 nor;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

uniform mat4 InverseM;

uniform vec3 light_pos;
uniform vec3 cam_pos;

varying vec3 Pos0;
varying vec3 Norm0;

varying vec3 ToLight;
varying vec3 ToView;

void main() {
	gl_Position = P * V * M * vec4(pos, 1.0);

	Pos0 = (M * vec4(pos, 1.0)).xyz;
	Norm0 = mat3(InverseM) * nor;
	ToLight = light_pos - Pos0;
	ToView = cam_pos - Pos0;
}