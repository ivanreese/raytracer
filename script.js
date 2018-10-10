// Generated by CoffeeScript 2.3.1
(function() {
  var Vector, animate, bounces, camera, canvas, ctx, data, height, intersectRay, isLightVisible, lights, objects, planet1, planet2, render, resize, sphereIntersection, sphereNormal, surface, tick, ticking, trace, width;

  Vector = {
    UP: {
      x: 0,
      y: 1,
      z: 0
    },
    ZERO: {
      x: 0,
      y: 0,
      z: 0
    },
    BLACK: {
      x: 0,
      y: 0,
      z: 0
    },
    WHITE: {
      x: 255,
      y: 255,
      z: 255
    },
    add: function(a, b) {
      return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
      };
    },
    add3: function(a, b, c) {
      return {
        x: a.x + b.x + c.x,
        y: a.y + b.y + c.y,
        z: a.z + b.z + c.z
      };
    },
    crossProduct: function(a, b) {
      return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
      };
    },
    dotProduct: function(a, b) {
      return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    },
    length: function(a) {
      return Math.sqrt(Vector.dotProduct(a, a));
    },
    reflectThrough: function(a, normal) {
      var dotted, doubled, scaled;
      dotted = Vector.dotProduct(a, normal);
      scaled = Vector.scale(normal, dotted);
      doubled = Vector.scale(scaled, 2);
      return Vector.subtract(doubled, a);
    },
    scale: function(a, s) {
      return {
        x: a.x * s,
        y: a.y * s,
        z: a.z * s
      };
    },
    subtract: function(a, b) {
      return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
      };
    },
    unitVector: function(a) {
      return Vector.scale(a, 1 / Vector.length(a));
    }
  };

  canvas = document.querySelector("canvas");

  ctx = canvas.getContext("2d");

  data = null;

  width = 0;

  height = 0;

  lights = [];

  objects = [];

  bounces = 3;

  camera = {
    point: {
      x: 0,
      y: 1.8,
      z: 10
    },
    fieldOfView: 45,
    vector: {
      x: 0,
      y: 3,
      z: 0
    }
  };

  lights.push({
    x: -30,
    y: -10,
    z: 20
  });

  lights.push({
    x: 30,
    y: -40,
    z: 0
  });

  objects.push({
    type: "sphere",
    point: {
      x: 0,
      y: 3.5,
      z: -3
    },
    color: {
      x: 155,
      y: 200,
      z: 155
    },
    specular: 0,
    lambert: 0.8,
    ambient: 0,
    radius: 3
  });

  objects.push({
    type: "sphere",
    point: {
      x: -4,
      y: 2,
      z: -1
    },
    color: {
      x: 255,
      y: 200,
      z: 150
    },
    specular: 0,
    lambert: 0.9,
    ambient: 0.0,
    radius: 0.4
  });

  objects.push({
    type: "sphere",
    point: {
      x: -4,
      y: 3,
      z: -1
    },
    color: {
      x: 150,
      y: 255,
      z: 255
    },
    specular: 0,
    lambert: 0.7,
    ambient: 0,
    radius: 0.2
  });

  isLightVisible = function(point, light) {
    var distObject, ray;
    ray = {
      point: point,
      vector: Vector.unitVector(Vector.subtract(point, light))
    };
    distObject = intersectRay(ray);
    return distObject[0] > -0.005;
  };

  surface = function(ray, object, pointAtTime, normal, depth) {
    var ambientColor, contribution, i, lambertAmount, lambertColor, len, lightPoint, lightToIntersection, reflectedColor, reflectedRay, specularColor;
    specularColor = Vector.ZERO;
    lambertAmount = 0;
    if (object.lambert) {
      for (i = 0, len = lights.length; i < len; i++) {
        lightPoint = lights[i];
        if (!isLightVisible(pointAtTime, lightPoint)) {
          continue;
        }
        lightToIntersection = Vector.unitVector(Vector.subtract(lightPoint, pointAtTime));
        contribution = Vector.dotProduct(lightToIntersection, normal);
        if (contribution > 0) {
          lambertAmount += contribution;
        }
      }
    }
    if (object.specular) {
      reflectedRay = {
        point: pointAtTime,
        vector: Vector.reflectThrough(ray.vector, normal)
      };
      if (reflectedColor = trace(reflectedRay, ++depth)) {
        specularColor = Vector.add(specularColor, Vector.scale(reflectedColor, object.specular));
      }
    }
    lambertAmount = Math.min(1, lambertAmount);
    lambertColor = Vector.scale(object.color, lambertAmount * object.lambert);
    ambientColor = Vector.scale(object.color, object.ambient);
    return Vector.add3(specularColor, lambertColor, ambientColor);
  };

  sphereNormal = function(sphere, pos) {
    return Vector.unitVector(Vector.subtract(pos, sphere.point));
  };

  sphereIntersection = function(sphere, ray) {
    var discriminant, eoDot, eye_to_center, v;
    eye_to_center = Vector.subtract(sphere.point, ray.point);
    v = Vector.dotProduct(eye_to_center, ray.vector);
    eoDot = Vector.dotProduct(eye_to_center, eye_to_center);
    discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);
    if (discriminant < 0) {
      return;
    }
    return v - Math.sqrt(discriminant);
  };

  intersectRay = function(ray) {
    var closest, dist, i, len, object;
    closest = [2e308, null];
    for (i = 0, len = objects.length; i < len; i++) {
      object = objects[i];
      dist = sphereIntersection(object, ray);
      if ((dist != null) && dist < closest[0]) {
        closest[0] = dist;
        closest[1] = object;
      }
    }
    return closest;
  };

  trace = function(ray, depth) {
    var dist, distObject, normal, object, pointAtTime;
    if (depth > bounces) {
      return;
    }
    distObject = intersectRay(ray);
    if (distObject[0] === 2e308) {
      return Vector.BLACK;
    }
    dist = distObject[0];
    object = distObject[1];
    pointAtTime = Vector.add(ray.point, Vector.scale(ray.vector, dist));
    normal = sphereNormal(object, pointAtTime);
    return surface(ray, object, pointAtTime, normal, depth);
  };

  render = function() {
    var cameraheight, camerawidth, color, eyeVector, fovRadians, halfHeight, halfWidth, heightWidthRatio, i, index, j, pixelHeight, pixelWidth, ray, ref, ref1, vpRight, vpUp, x, xcomp, y, ycomp;
    eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point));
    vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP));
    vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector));
    fovRadians = Math.PI * (camera.fieldOfView / 2) / 180;
    heightWidthRatio = height / width;
    halfWidth = Math.tan(fovRadians);
    halfHeight = heightWidthRatio * halfWidth;
    camerawidth = halfWidth * 2;
    cameraheight = halfHeight * 2;
    pixelWidth = camerawidth / (width - 1);
    pixelHeight = cameraheight / (height - 1);
    index = null;
    color = null;
    ray = {
      point: camera.point
    };
    for (x = i = 0, ref = width; (0 <= ref ? i < ref : i > ref); x = 0 <= ref ? ++i : --i) {
      for (y = j = 0, ref1 = height; (0 <= ref1 ? j < ref1 : j > ref1); y = 0 <= ref1 ? ++j : --j) {
        xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth);
        ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);
        ray.vector = Vector.unitVector(Vector.add3(eyeVector, xcomp, ycomp));
        color = trace(ray, 0);
        index = (x * 4) + (y * width * 4);
        data.data[index + 0] = color.x;
        data.data[index + 1] = color.y;
        data.data[index + 2] = color.z;
        data.data[index + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    return void 0;
  };

  planet1 = -0.5;

  planet2 = -0.5;

  animate = function() {
    planet1 += 0.01;
    planet2 += 0.02;
    objects[1].point.x = 3.5 * Math.sin(planet1);
    objects[1].point.z = -3 + 3.5 * Math.cos(planet1);
    objects[2].point.x = 4 * Math.sin(planet2);
    return objects[2].point.z = -3 + 4 * Math.cos(planet2);
  };

  ticking = false;

  tick = function() {
    animate();
    render();
    if (ticking) {
      return requestAnimationFrame(tick);
    }
  };

  resize = function() {
    var dpi;
    dpi = window.devicePixelRatio / 6;
    width = canvas.width = window.innerWidth * dpi;
    height = canvas.height = window.innerHeight * dpi;
    ctx.scale(dpi, dpi);
    data = ctx.getImageData(0, 0, width, height);
    if (!ticking) {
      return tick();
    }
  };

  window.addEventListener("resize", resize);

  resize();

  window.addEventListener("click", function() {
    ticking = !ticking;
    if (ticking) {
      return requestAnimationFrame(tick);
    }
  });

}).call(this);
