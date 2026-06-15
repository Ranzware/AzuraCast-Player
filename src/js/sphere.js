/**
 * ThreeJS scene calm glowing orb object (Islamic-inspired visualizer)
 */
export default {
  group: null,
  orb: null,
  glow: null,
  ring: null,
  move: new THREE.Vector3(0, 0, 0),
  touch: false,
  ease: 12,

  // create and add orb to scene
  create(box, scene) {
    this.group = new THREE.Object3D()

    // main glowing orb
    const geometry = new THREE.IcosahedronGeometry(60, 3)
    const material = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    })
    this.orb = new THREE.Mesh(geometry, material)

    // inner soft glow core
    const coreGeometry = new THREE.IcosahedronGeometry(46, 2)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.08,
    })
    this.core = new THREE.Mesh(coreGeometry, coreMaterial)

    // outer crescent ring
    const ringGeometry = new THREE.TorusGeometry(90, 2, 16, 80)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    })
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial)
    this.ring.rotation.x = Math.PI / 2 + 0.5
    this.ring.rotation.y = 0.3

    this.group.add(this.orb)
    this.group.add(this.core)
    this.group.add(this.ring)

    this.touch =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0

    this.group.position.set(40, 5, 0)
    this.group.rotation.x = Math.PI / 2 + 0.6
    scene.add(this.group)
  },

  // animate orb on frame loop
  update(box, mouse, freq) {
    const xoff = box.width < 800 ? 0 : 40
    const zoff = box.width < 800 ? -80 : 0

    // prevent orb from moving on touch devices
    if (this.touch) {
      this.group.position.x = xoff
    } else {
      this.move.x = xoff + -(mouse.x * 0.006)
      this.move.y = -(mouse.y * 0.006)
      this.group.position.x += (this.move.x - this.group.position.x) / this.ease
      this.group.position.y += (this.move.y - this.group.position.y) / this.ease
    }

    // gentle z-breathing with music data
    this.group.position.z = zoff + 30 * freq

    // very slow, calm rotations
    this.group.rotation.y -= 0.0015
    this.group.rotation.z += 0.0008

    this.orb.rotation.x += 0.001
    this.orb.rotation.y -= 0.0015
    this.core.rotation.x -= 0.0008
    this.core.rotation.y += 0.001

    this.ring.rotation.z += 0.0005
    this.ring.rotation.y += 0.0003

    // pulsing opacity based on audio frequency
    this.orb.material.opacity = 0.12 + 0.16 * freq
    this.core.material.opacity = 0.05 + 0.12 * freq
    this.ring.material.opacity = 0.12 + 0.18 * freq
  },
}
