/**
 * ThreeJS scene light object
 */
export default {
  color: null,
  light: null,

  // create and add light to scene
  create(box, scene) {
    this.color = new THREE.Color()
    this.color.setHSL(0.45, 0.7, 0.5) // emerald green base

    this.light = new THREE.PointLight(0x10b981, 3, 500)
    this.light.position.set(0, 0, 420)
    this.light.castShadow = false
    this.light.target = scene
    this.light.color = this.color

    // warm gold rim light
    this.rim = new THREE.PointLight(0xf59e0b, 1.5, 600)
    this.rim.position.set(120, -80, 260)
    scene.add(this.rim)

    scene.add(this.light)
  },

  // animate light on frame loop
  update(box, mouse, freq) {
    const zinit = box.width < 820 ? 260 : 320
    const zoff = box.width < 820 ? 60 : 80
    this.light.distance = zinit + zoff * freq

    // shift between emerald and gold based on audio
    const hue = 0.42 + 0.1 * freq // emerald to gold
    this.color.setHSL(hue, 0.7, 0.45 + 0.15 * freq)
  },
}
