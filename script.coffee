Vector =
  UP: x: 0, y: 1, z: 0
  ZERO: x: 0, y: 0, z: 0
  BLACK: x: 0, y: 0, z: 0
  WHITE: x: 255, y: 255, z: 255
  add: (a, b)-> x: a.x + b.x, y: a.y + b.y, z: a.z + b.z
  add3: (a, b, c)-> x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: a.z + b.z + c.z
  crossProduct: (a, b)-> x: (a.y * b.z) - (a.z * b.y), y: (a.z * b.x) - (a.x * b.z), z: (a.x * b.y) - (a.y * b.x)
  dotProduct: (a, b)-> (a.x * b.x) + (a.y * b.y) + (a.z * b.z)
  length: (a)-> Math.sqrt Vector.dotProduct a, a
  reflectThrough: (a, normal)->
    dotted = Vector.dotProduct a, normal
    scaled = Vector.scale normal, dotted
    doubled = Vector.scale scaled, 2
    Vector.subtract doubled, a
  scale: (a, s)-> x: a.x * s, y: a.y * s, z: a.z * s
  subtract: (a, b)-> x: a.x - b.x, y: a.y - b.y, z: a.z - b.z
  unitVector: (a)-> Vector.scale a, 1 / Vector.length a

canvas = document.querySelector "canvas"
ctx = canvas.getContext "2d"
data = null

width = 0
height = 0

lights = []
objects = []

bounces = 3

camera =
  point:
    x: 0
    y: 1.8
    z: 10
  fieldOfView: 45
  vector:
    x: 0
    y: 3
    z: 0

lights.push
  x: -30
  y: -10
  z: 20

lights.push
  x: 30
  y: -40
  z: 0

objects.push
  type: "sphere"
  point:
    x: 0
    y: 3.5
    z: -3
  color:
    x: 155
    y: 200
    z: 155
  specular: 0
  lambert: 0.8
  ambient: 0
  radius: 3

objects.push
  type: "sphere"
  point:
    x: -4
    y: 2
    z: -1
  color:
    x: 255
    y: 200
    z: 150
  specular: 0
  lambert: 0.9
  ambient: 0.0
  radius: 0.4

objects.push
  type: "sphere"
  point:
    x: -4
    y: 3
    z: -1
  color:
    x: 150
    y: 255
    z: 255
  specular: 0
  lambert: 0.7
  ambient: 0
  radius: 0.2


isLightVisible = (point, light)->
  ray =
    point: point
    vector: Vector.unitVector Vector.subtract point, light
  distObject = intersectRay ray
  return distObject[0] > -0.005


surface = (ray, object, pointAtTime, normal, depth)->
  specularColor = Vector.ZERO
  lambertAmount = 0

  if object.lambert
    for lightPoint in lights
      continue unless isLightVisible pointAtTime, lightPoint

      lightToIntersection = Vector.unitVector Vector.subtract lightPoint, pointAtTime
      contribution = Vector.dotProduct lightToIntersection, normal
      lambertAmount += contribution if contribution > 0

  if object.specular
    reflectedRay =
      point: pointAtTime
      vector: Vector.reflectThrough ray.vector, normal
    if reflectedColor = trace reflectedRay, ++depth
      specularColor = Vector.add specularColor, Vector.scale reflectedColor, object.specular

  lambertAmount = Math.min 1, lambertAmount

  lambertColor = Vector.scale object.color, lambertAmount * object.lambert
  ambientColor = Vector.scale object.color, object.ambient
  Vector.add3 specularColor, lambertColor, ambientColor


sphereNormal = (sphere, pos)->
  Vector.unitVector Vector.subtract pos, sphere.point


sphereIntersection = (sphere, ray)->
  eye_to_center = Vector.subtract sphere.point, ray.point
  v = Vector.dotProduct eye_to_center, ray.vector
  eoDot = Vector.dotProduct eye_to_center, eye_to_center
  discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v)
  return if discriminant < 0
  v - Math.sqrt discriminant


intersectRay = (ray)->
  closest = [Infinity, null]

  for object in objects
    dist = sphereIntersection object, ray
    if dist? && dist < closest[0]
      closest[0] = dist
      closest[1] = object

  return closest


trace = (ray, depth)->
  return if depth > bounces

  distObject = intersectRay ray

  return Vector.BLACK if distObject[0] is Infinity

  dist = distObject[0]
  object = distObject[1]
  pointAtTime = Vector.add ray.point, Vector.scale ray.vector, dist
  normal = sphereNormal object, pointAtTime

  surface ray, object, pointAtTime, normal, depth


render = ()->
  eyeVector = Vector.unitVector Vector.subtract camera.vector, camera.point

  vpRight = Vector.unitVector Vector.crossProduct eyeVector, Vector.UP
  vpUp = Vector.unitVector Vector.crossProduct vpRight, eyeVector

  fovRadians = Math.PI * (camera.fieldOfView / 2) / 180
  heightWidthRatio = height / width
  halfWidth = Math.tan fovRadians
  halfHeight = heightWidthRatio * halfWidth
  camerawidth = halfWidth * 2
  cameraheight = halfHeight * 2
  pixelWidth = camerawidth / (width - 1)
  pixelHeight = cameraheight / (height - 1)

  index = null
  color = null
  ray = point: camera.point

  for x in [0...width]
    for y in [0...height]

      xcomp = Vector.scale vpRight, (x * pixelWidth) - halfWidth
      ycomp = Vector.scale vpUp, (y * pixelHeight) - halfHeight

      ray.vector = Vector.unitVector Vector.add3 eyeVector, xcomp, ycomp

      color = trace ray, 0
      index = (x * 4) + (y * width * 4)
      data.data[index + 0] = color.x
      data.data[index + 1] = color.y
      data.data[index + 2] = color.z
      data.data[index + 3] = 255

  ctx.putImageData data, 0, 0

  undefined

planet1 = -0.5
planet2 = -0.5

animate = ()->
  planet1 += 0.01
  planet2 += 0.02

  objects[1].point.x = 3.5 * Math.sin planet1
  objects[1].point.z = -3 + 3.5 * Math.cos planet1

  objects[2].point.x = 4 * Math.sin planet2
  objects[2].point.z = -3 + 4 * Math.cos planet2


ticking = false

tick = ()->
  animate()
  render()
  requestAnimationFrame tick if ticking

resize = ()->
  dpi = window.devicePixelRatio / 6
  width = canvas.width = window.innerWidth * dpi
  height = canvas.height = window.innerHeight * dpi
  ctx.scale dpi, dpi
  data = ctx.getImageData 0, 0, width, height
  tick() unless ticking

window.addEventListener "resize", resize
resize()

window.addEventListener "click", ()->
  ticking = not ticking
  requestAnimationFrame tick if ticking
