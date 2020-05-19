precision mediump float;

uniform sampler2D texture;

varying highp vec2 UV0;
varying vec3 Norm0;

void main() {
	gl_FragColor = texture2D(texture, UV0);
}