var stage = null;
var drawobjs = [];
var play = [];

Array.prototype.remove = function (from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};



function forcehidenavbar() {
  if (drawobjs.length > 0) {
    for (var i = 0; i < drawobjs.length; i++) {
      drawobjs[i].forcehide();
    }
  }

}
var onDeviceReady = function () {
  window.localStorage.setItem("dbinit", "false");
  var db = window.sqlitePlugin.openDatabase("Database", "1.0", "clipart", 2 * 1024 * 1024);
  db.transaction(function (tx) {
    dbinit(tx);

  }, function (e) {
    console.log("ERROR: " + e.message);
  });

  makefilter(db, 'bộ phận cơ thể', 'bộ mặt', 'brown', 'init');

  stage = new Kinetic.Stage({
    container: "workspace",
    width: $(document).width(),
    height: $(document).height()
  });

  makedrawtext(stage);
  makedrawimage(stage);

  $('a#uploadphoto').on('tap', function () {
    uploadphoto();

  });

  $('a#savephoto').on('tap', function () {
    savephoto();
  });

  $('#sendemail input#submit').on('tap', function () {
    var subject = $('#sendemail input#subject').val();
    var content = $('#sendemail textarea#content').val();
    //alert(subject);
    if (subject != '' && content != '') {
      sendmail(subject, content);
    }

  });

  // $('input#share').button('disable');
  //$('textarea#message').textinput('disable');
  //alert(device.uuid)
  FB.init({
    appId: '208423082509531',
    nativeInterface: CDV.FB,
    useCachedDialogs: false
  });

  FB.getLoginStatus(handleStatusChange);

  authUser();
  //updateAuthElements();

};

function uploadphoto() {
  navigator.camera.getPicture(onCameraSuccess, onCameraError, {
    quality: 100,
    destinationType: Camera.DestinationType.FILE_URI,
    sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
    mediaType: Camera.MediaType.PICTURE
  });
}

function savephoto() {
  var state = $.Deferred();
  forcehidenavbar();
  stage.toDataURL({
    callback: function (dataUrl) {
      var string = dataUrl;
      string = string.replace(/^data:image\/(png|jpg);base64,/, "");
      var prefix = 'Sedi';
      var d = new Date();
      var current = d.getTime();
      var extension = '.png';
      var filename = prefix + '_' + current + extension;
      state.resolve({
        filename: filename,
        string: string
      });

      window.plugins.base64ToPNG.saveImage(string, {
        filename: filename,
        overwrite: true
      },

      function (result) {
        navigator.notification.confirm(
          'Ảnh đã được lưu có tên là ' + filename + ' và được lưu trữ tại thẻ nhớ trong thư mục Pictures\nBạn có muốn thiết lập lại hay không ?',
        onConfirm,
          'Thông báo thành công',
          'Có,Không');
        $('a#savephoto').removeClass('ui-btn-active');
      }, function (error) {
        navigator.notification.alert(
          'Lỗi không lưu được ảnh!',
        queryerr,
          'Thông báo lỗi',
          'Hãy thử lại');
        $('a#savephoto').removeClass('ui-btn-active');
      });

    },
    mimeType: 'image/png',
    quality: 1
  });

  return state.promise();
}

function onConfirm(buttonIndex) {
  if (buttonIndex == 1) {
    stage.reset();
    stage.draw();
  }
}

function onCameraSuccess(imageURL) {
  console.log("Đường dẫn của ảnh lấy từ thư viện :" + imageURL);
  //alert(imageURL);
  var image = new Image();
  image.onload = function () {
    var imagelib = new drawimage(stage, image);
    drawobjs.push(imagelib);
    imagelib.insert();
  };
  image.src = imageURL;
  $('a#uploadphoto').removeClass('ui-btn-active');

}

function onCameraError(e) {
  navigator.notification.alert(
    "onCameraError: " + e,
  onCameraDismiss,
    "Thông báo lỗi",
    "Chấp nhận");
  $('a#uploadphoto').removeClass('ui-btn-active');
}

function onCameraDismiss() {
  $('a#uploadphoto').removeClass('ui-btn-active');

}

function sendmail(subject, body) {
  var extras = {};
  extras[WebIntent.EXTRA_EMAIL] = 'ngotrung.poli.t@gmail.com';
  extras[WebIntent.EXTRA_SUBJECT] = subject;
  extras[WebIntent.EXTRA_TEXT] = body;
  window.plugins.webintent.startActivity({
    action: WebIntent.ACTION_SEND,
    type: 'text/plain',
    extras: extras
  },

  function () {
    navigator.notification.alert(
      'Cảm ơn bạn đã gửi email phản hồi cho tôi\nXin chân thành cảm ơn!',
    queryerr,
      'Thông báo thành công',
      'Chấp nhận');
  },

  function () {
    navigator.notification.alert(
      'Không gửi được email, xin vui lòng gửi lại',
    queryerr,
      'Thông báo lỗi',
      'Chấp nhận');
  });
}

function renderitem(path, filename, name) {
  var html = '<li><a href="#"><img src=' + path + filename + ' /><h3>' + name + '</h3></a></li>';
  return html;
}

function init() {
  document.addEventListener("deviceready", onDeviceReady, true);
}

function options() {

}

function query() {
  this.exec = function (db, sql, start, limit) {
    if (!db) {
      query.err();
    } else {
      var result = $.Deferred();
      db.transaction(function (tx) {
        tx.executeSql(sql, [], function (tx, res) {
          var items = [];
          for (var i = 0; i < res.rows.length; i++) {
            items[i] = res.rows.item(i);
          }
          result.resolve(items);
        });
      }, function (e) {
        query.err(e);
      });
      return result.promise();

    }
  };
}

query.err = function (e) {
  if (typeof e == "undefined") {
    navigator.notification.alert(
      'Lỗi cơ sở dữ liệu!',
    queryerr,
      'Thông báo lỗi',
      'Chấp nhận');

  } else {
    navigator.notification.alert(
      'Lỗi truy vấn cơ sở dữ liệu!\nThông tin lỗi chi tiết: ' + e.message,
    queryerr,
      'Thông báo lỗi',
      'Chấp nhận');
  }

};

function queryerr() {

}

function filters(db, subject, shapetype, color) {
  //filters.result;
  this.db = db;
  this.subject = subject;
  this.shapetype = shapetype;
  this.color = color;
  this.list_subject = function () {
    var state_subject = $.Deferred();
    var sql = 'SELECT DISTINCT shape.subject FROM shape GROUP BY subject';
    var result = this.exec(this.db, sql);
    //console.log(this.exec);
    result.done(function (data) {
      var subjects = [];
      for (var i = 0; i < data.length; i++) {
        subjects[i] = data[i].subject;
      }
      //console.log('thử nghiệm Deferred'+subjects);
      state_subject.resolve(subjects);
    });
    return state_subject.promise();
  };
  this.list_shapetype = function () {
    var state_shapetype = $.Deferred();
    var sql = 'SELECT shape.shapetype FROM shape WHERE subject = "' + this.subject + '" GROUP BY shapetype';
    //console.log(sql);
    var result = this.exec(this.db, sql);
    result.done(function (data) {
      //console.log(data);
      var shapetypes = [];
      for (var i = 0; i < data.length; i++) {
        shapetypes[i] = data[i].shapetype;
      }
      console.log('thử nghiệm Deferred shapetype:' + shapetypes);
      state_shapetype.resolve(shapetypes);

    });
    return state_shapetype.promise();
  };
  this.list_color = function () {
    var state_color = $.Deferred();
    var sql = 'SELECT shape.color FROM shape WHERE subject = "' + this.subject + '" AND shapetype = "' + this.shapetype + '" GROUP BY color';
    var result = this.exec(this.db, sql);
    result.done(function (data) {
      var colors = [];
      for (var i = 0; i < data.length; i++) {
        colors[i] = data[i].color;
      }
      console.log('thử nghiệm Deferred color:' + colors);
      state_color.resolve(colors);

    });
    return state_color.promise();
  };
  this.list_image = function () {
    var state_image = $.Deferred();
    var sql = 'SELECT shape.path,shape.filename FROM shape WHERE subject = "' + this.subject + '" AND shapetype = "' + this.shapetype + '" AND color = "' + this.color + '" GROUP BY filename';
    // var sql = 'SELECT shape.path,shape.filename FROM shape WHERE subject = "' + this.subject + '" AND shapetype = "' + this.shapetype + '" AND color = "' + this.color + '" ';
    var result = this.exec(this.db, sql);
    result.done(function (data) {
      var images = [];
      for (var i = 0; i < data.length; i++) {
        var path = data[i].path;
        var filename = data[i].filename;
        images[i] = path + filename;
      }
      console.log('thử nghiệm Deferred image :' + images);
      state_image.resolve(images);

    });
    return state_image.promise();
  };


}

filters.prototype = new query();

function onchange(db, filters_obj) {
  var obj = this;
  this.db = db;
  this.render_options = function (arr) {
    var html = '';
    for (var i = 0; i < arr.length; i++) {
      html += '<option value = "' + arr[i] + '">' + arr[i] + '</option>';
    }
    return html;
  };
  this.flyonchange = function () {

    $('#filter').on('change', 'select#subjects', function () {
      var subject = $(this).val();
      obj.subject = subject;
      var list_shapetype = filters_obj.list_shapetype.call(obj);
      list_shapetype.done(function (shapetype) {
        obj.shapetype = shapetype[0];
        var list_color = filters_obj.list_color.call(obj);
        list_color.done(function (color) {
          obj.color = color[0];
          //makefilter(db,obj.subject,obj.shapetype,obj.color);
          var list_image = filters_obj.list_image.call(obj);
          list_image.done(function (image) {
            var slideshow = gallery.factory();
            //$('#slideshow').html(slideshow.render(image)).trigger('create');
            $('#slideshow').html(slideshow.render(image));
            //var play = new player(image);
            play.setsrc(image);
            play.control();
            //play.getcurrent();
          });
          var render = obj.render_options(color);
          $('select#color').html(render).selectmenu('refresh');

        });

        var render = obj.render_options(shapetype);
        $('select#shapetypes').html(render).selectmenu('refresh');
      });

    });

    $('#filter').on('change', 'select#shapetypes', function () {
      var subject = $('select#subjects').val();
      obj.subject = subject;
      obj.shapetype = $(this).val();
      var list_color = filters_obj.list_color.call(obj);
      list_color.done(function (color) {
        obj.color = color[0];
        //makefilter(db,obj.subject,obj.shapetype,obj.color);
        var list_image = filters_obj.list_image.call(obj);
        list_image.done(function (image) {
          var slideshow = gallery.factory();
          //$('#slideshow').html(slideshow.render(image)).trigger('create');
          $('#slideshow').html(slideshow.render(image));
          //var play = new player(image);
          play.setsrc(image);
          play.control();
          //play.getcurrent();
        });
        var render = obj.render_options(color);
        $('select#color').html(render).selectmenu('refresh');

      });
    });

    $('#filter').on('change', 'select#color', function () {
      obj.subject = $('select#subjects').val();
      obj.shapetype = $('select#shapetypes').val();
      obj.color = $(this).val();
      var list_image = filters_obj.list_image.call(obj);
      list_image.done(function (image) {
        var slideshow = gallery.factory();
        //$('#slideshow').html(slideshow.render(image)).trigger('create');
        $('#slideshow').html(slideshow.render(image));
        //var play = new player(image);
        play.setsrc(image);
        play.control();
        //play.getcurrent();
      });
    });

  };

}
onchange.prototype = new query();

function player() {
  var image = null;
  var obj = this;
  var count = 1;
  this.setsrc = function (img) {
    image = img;
    count = 1;
    //alert('active');
    obj.total = image.length;
    obj.maxcount = Math.ceil(obj.total / gallery.items);
    //alert(obj.maxcount);
  };
  this.shownav = function (ele) {
    switch (ele) {
      case 'next':
        $('#next').show();
        break;
      case 'prev':
        $('#prev').show();
        break;
      case 'all':
        $('#next').show();
        $('#prev').show();
        break;
      default:
        alert('Lỗi truyền vào tham số sai trong phương thức shownav của player');

    }
  };
  this.hidenav = function (ele) {
    switch (ele) {
      case 'next':
        $('#next').hide();
        break;
      case 'prev':
        $('#prev').hide();
        break;
      case 'all':
        $('#next').hide();
        $('#prev').hide();
        break;
      default:
        alert('Lỗi truyền vào tham số sai trong phương thức hidenav của player');

    }

  };

  obj.getcurrent = function () {
    obj.control();
    $('#slideshow').off('click', '#next');
    $('#slideshow').on('click', '#next', function () {
      if (count < obj.maxcount) {
        count++;
      }
      obj.play();
      obj.control();
    });

    $('#slideshow').off('click', '#prev');
    $('#slideshow').on('click', '#prev', function () {
      if (count > 1) {
        count--;
      }
      obj.play();
      obj.control();
    });

    $('#slideshow').on('swipeleft', function () {
      //alert('left');
      $('#prev').trigger('click');
    });
    $('#slideshow').on('swiperight', function () {
      //alert('right');
      $('#next').trigger('click');
    });

  };

  obj.control = function () {
    if (obj.maxcount <= 1) {
      obj.hidenav('all');
    } else {
      if (count <= 1) {
        obj.shownav('next');
        obj.hidenav('prev');
      } else if (1 < count && count < obj.maxcount) {
        obj.shownav('next');
        obj.shownav('prev');
      } else {
        obj.shownav('prev');
        obj.hidenav('next');
      }
    }
  };

  obj.play = function (st, en) {
    this.start = st || (count - 1) * gallery.items;
    if (this.start < 0) {
      this.start = 0;
    }
    this.end = en || count * gallery.items;
    //alert(player.end);
    var items = image.slice(this.start, this.end);
    var slideshow = gallery.factory();
    $('#slideshow').html(slideshow.render(items));
  };
}

function makefilter(db, subject, shapetype, color, flag) {
  var filter = new filters(db, subject, shapetype, color);

  //console.log(filter);
  var state_subject = filter.list_subject();
  var state_shapetype = filter.list_shapetype();
  var state_color = filter.list_color();
  var state_image = filter.list_image();
  var change = new onchange(db, filter);
  change.flyonchange();
  play = new player();

  //console.log(filters.state_subject);
  $.when(state_subject, state_shapetype, state_color, state_image).done(function (subject, shapetype, color, image) {
    //alert(image);
    console.log('subjects :' + subject);
    var slideshow = gallery.factory();
    //var render = slideshow.render(image);
    //alert(render);
    console.log('HTML filter :' + filter);
    //console.log('HTML gallery :'+render);
    //$('#slideshow').html(slideshow.render(image)).trigger('create');
    $('#slideshow').html(slideshow.render(image));
    if (flag == 'init') {
      var filter = gallery.filter(subject, shapetype, color);
      $('#filter').html(filter).trigger('create');
      //$('#filter').html(filter);
    }

    play.setsrc(image);
    console.log('đối tượng :' + play);
    play.getcurrent();
  });

  $("#gallerypanel").on({
    popupbeforeposition: function () {
      var h = $(document).height() / 3;
      var w = $(document).width()

      $(this).css({
        "height": h,
        "width": w
      });
    }
  });


}

function gallery() {
  gallery.prototype.width = $(document).width();
  gallery.prototype.height = $(document).height() / 3;
  //gallery.prototype.htmlfilter = '';
  gallery.items = 5;
}
gallery.prototype.device = 'tablnet';

gallery.factory = function () {
  var type = ['smartphone', 'tablnet'];
  var newdevice;
  var minitype = ' data-mini = "false" ';

  if ($(document).width() >= $(document).height()) {
    gallery.prototype.device = type[1];
  } else {
    minitype = ' data-mini = "true" ';
    gallery.prototype.device = type[0];
  }
  var type_device = gallery.prototype.device;
  if (!gallery[type_device].prototype.width) {
    gallery.filter = function (subjects, shapetypes, colors) {
      var html = '<div data-role="controlgroup" data-type="horizontal" id="filters"' + minitype + ' style="margin: 0px auto; margin-left:auto; margin-right:auto; text-align:center;">\
	        	                           <select name="subjects" id="subjects"' + minitype + ' data-native-menu="false">';
      for (var i = 0; i < subjects.length; i++) {
        html += '<option value="' + subjects[i] + '">' + subjects[i] + '</option>';
      }
      html += '</select>\
	        	                           <select name="shapetypes" id="shapetypes"' + minitype + ' data-native-menu="false">';
      for (var i = 0; i < shapetypes.length; i++) {
        html += '<option value="' + shapetypes[i] + '">' + shapetypes[i] + '</option>';
      }
      html += ' </select>\
	        	                           <select name="color" id="color"' + minitype + ' data-native-menu="false">';
      for (var i = 0; i < colors.length; i++) {
        html += '<option value="' + colors[i] + '">' + colors[i] + '</option>';
      }

      html += '  </select>\
	        	                       </div>';
      //gallery.prototype.htmlfilter = html;
      return html;
    };
    gallery[type_device].prototype = new gallery();

  }
  newdevice = new gallery[type_device]();
  return newdevice;

};
gallery.smartphone = function () {
  this.items = 3;
  gallery.items = this.items;
  this.border_style;
  this.image_style;
  this.style_code = function () {
    var w = this.width / this.items;
    var h = this.height - 58;
    var width_image_style = w - 5;
    var maxheight_image_style = h;
    this.border_style = ' style = "width: ' + w + 'px; height: ' + h + 'px; border: #000 1px dotted;" ';
    this.image_style = ' style ="width: ' + width_image_style + 'px; max-height: ' + maxheight_image_style + 'px;" ';
  };

  this.checkvalid = function (valid) {
    var html = '';
    if (typeof valid != 'undefined') {
      html = '<img alt="" src="' + valid + '"' + this.image_style + ' />';
    }
    return html;
  };

  this.render = function (src_arr) {
    this.style_code();
    var html = '<div class="ui-grid-b" id="gallery">\
	        	                      <div class="ui-block-a">\
									  <img src="navbar/fancy_nav_left.png" width="30" height="30" id="prev">\
	        	                        <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[0]) + '</div>\
	        	                      </div>\
	        	                    <div class="ui-block-b">\
	        	                       <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[1]) + '</div>\
	        	                    </div>\
	        	                   <div class="ui-block-c">\
								   <img src="navbar/fancy_nav_right.png" width="30" height="30" id="next">\
	        	                    <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[2]) + '</div>\
	        	                   </div>\
	        	                </div>';
    //html += this.htmlfilter;
    return html;

  };

};

gallery.tablnet = function () {
  this.items = 5;
  gallery.items = this.items;
  this.border_style;
  this.image_style;
  this.style_code = function () {
    var w = this.width / this.items;
    var h = this.height - 58;
    var width_image_style = w - 105;
    var maxheight_image_style = h;
    this.border_style = ' style = "width: ' + w + 'px; height: ' + h + 'px; border: #000 1px dotted;" ';
    this.image_style = ' style ="width: ' + width_image_style + 'px; max-height: ' + maxheight_image_style + 'px;" ';
  };
  this.checkvalid = function (valid) {
    var html = '';
    if (typeof valid != 'undefined') {
      html = '<img alt="" src="' + valid + '"' + this.image_style + ' />';
    }
    return html;
  };
  this.render = function (src_arr) {
    this.style_code();
    var html = '<div class="ui-grid-d" id="gallery">\
	        	                      <div class="ui-block-a">\
									  <img src="navbar/fancy_nav_left.png" width="30" height="30" id="prev">\
	        	                        <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[0]) + '</div>\
	        	                      </div>\
	        	                    <div class="ui-block-b">\
	        	                       <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[1]) + '</div>\
	        	                    </div>\
	        	                   <div class="ui-block-c">\
	        	                     <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[2]) + '</div>\
	        	                   </div>\
	        	                  <div class="ui-block-d">\
	        	                     <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[3]) + '</div>\
	        	                   </div>\
	        	                  <div class="ui-block-e">\
								  <img src="navbar/fancy_nav_right.png" width="30" height="30" id="next">\
	        	                     <div class="border" ' + this.border_style + '>' + this.checkvalid(src_arr[4]) + '</div>\
	        	                  </div>\
	        	                </div>';
    //html += this.htmlfilter;
    return html;

  };
};

function makedrawimage(stage) {
  $('#slideshow').on('taphold dblclick', '.border', function () {
    //alert('done');
    var src = $(this).find('img').attr('src');
    //console.log('src'+src);
    if (typeof src != 'undefined') {
      var image = new Image();
      image.onload = function () {
        var imagelib = new drawimage(stage, image);
        drawobjs.push(imagelib);
        imagelib.insert();
      };
      image.src = src;
    }

  });

}

function drawimage(stage, imgsrc) {
  var obj = this;
  this.topleft = '';
  this.topright = '';
  this.bottomleft = '';
  this.bottomright = '';
  this.imageobj = '';
  this.rotatecw = '';
  this.rotateccw = '';
  this.groupobj = '';
  this.close = '';
  this.layerobj = '';

  this.width = imgsrc.width;
  this.height = imgsrc.height;
  this.name = imgsrc.name;
  this.image = imgsrc;
  drawimage.stage = stage;


  this.addAnchor = function (group, x, y, name) {
    var stage = group.getStage();
    var layer = group.getLayer();

    var anchor = new Kinetic.Circle({
      x: x,
      y: y,
      stroke: "#666",
      fill: "#ddd",
      strokeWidth: 2,
      radius: 8,
      name: name,
      draggable: true
    });
    if (name == 'topLeft' || name == 'bottomLeft' || name == 'topRight') {
      anchor.setVisible(false);
    }

    anchor.on("dragmove", function () {
      obj.update(group, this);
      layer.draw();
    });
    anchor.on("mousedown touchstart", function () {
      group.setDraggable(false);
      this.moveToTop();
    });
    anchor.on("dragend", function () {
      group.setDraggable(true);
      layer.draw();
    });
    // add hover styling
    anchor.on("mouseover", function () {
      var layer = this.getLayer();
      document.body.style.cursor = "se-resize";
      this.setStrokeWidth(4);
      layer.draw();
    });
    anchor.on("mouseout", function () {
      var layer = this.getLayer();
      document.body.style.cursor = "default";
      this.setStrokeWidth(2);
      layer.draw();
    });
    group.add(anchor);

    return anchor;
  };

  this.update = function (group, activeAnchor) {
    var topLeft = obj.topleft;
    var topRight = obj.topright;
    var bottomRight = obj.bottomright;
    var bottomLeft = obj.bottomleft;
    var image = obj.imageobj;

    var width = topRight.attrs.x - topLeft.attrs.x;
    var height = bottomLeft.attrs.y - topLeft.attrs.y;

    // update anchor positions
    switch (activeAnchor.getName()) {
      case "topLeft":
        topRight.attrs.y = activeAnchor.attrs.y;
        bottomLeft.attrs.x = activeAnchor.attrs.x;
        break;
      case "topRight":
        topLeft.attrs.y = activeAnchor.attrs.y;
        bottomRight.attrs.x = activeAnchor.attrs.x;
        break;
      case "bottomRight":
        bottomLeft.attrs.y = activeAnchor.attrs.y;
        topRight.attrs.x = activeAnchor.attrs.x;
        break;
      case "bottomLeft":
        bottomRight.attrs.y = activeAnchor.attrs.y;
        topLeft.attrs.x = activeAnchor.attrs.x;
        break;
    }

    image.setPosition(topLeft.attrs.x, topLeft.attrs.y);
    //image.setPosition(obj.groupobj.getPosition().x, obj.groupobj.getPosition().y);
    if (width && height) {
      image.setSize(width, height);
      obj.updatenavbar();
    }
  };

  this.insert = function () {
    this.scale();

    var groups = new Kinetic.Group({
      x: ($(document).width() - this.width) / 2,
      y: ($(document).height() - this.height) / 2,
      draggable: true
    });
    var layer = new Kinetic.Layer();
    layer.add(groups);

    this.layerobj = layer;
    drawimage.stage.add(layer);

    var imageshape = new Kinetic.Image({
      x: 0,
      y: 0,
      image: this.image,
      width: this.width,
      height: this.height,
      name: "image"
    });

    /*imageshape.createImageHitRegion(function() {
    	layer.drawHit();
     });
*/
    groups.add(imageshape);

    this.topleft = this.addAnchor(groups, 0, 0, "topLeft");
    this.topright = this.addAnchor(groups, this.width, 0, "topRight");
    this.bottomright = this.addAnchor(groups, this.width, this.height, "bottomRight");
    this.bottomleft = this.addAnchor(groups, 0, this.height, "bottomLeft");
    this.imageobj = imageshape;
    this.groupobj = groups;

    this.addnavbar();
    this.openpanel();

    layer.on("dragstart", function () {
      this.moveToTop();
    });

    //this.forcehide();

    imageshape.on("tap click", function () {
      var layer = this.getLayer();
      var topLeft = obj.topleft;
      var topRight = obj.topright;
      var bottomRight = obj.bottomright;
      var bottomLeft = obj.bottomleft;
      var rotatecw = obj.rotatecw;
      var rotateccw = obj.rotateccw;
      var close = obj.close;
      if (bottomRight.isVisible()) {
        topLeft.hide();
        topRight.hide();
        bottomRight.hide();
        bottomLeft.hide();
        rotatecw.hide();
        rotateccw.hide();
        close.hide();
      } else {
        //topLeft.show();
        //topRight.show();
        bottomRight.show();
        //bottomLeft.show();
        rotatecw.show();
        rotateccw.show();
        close.show();
      }

    });
    drawimage.stage.draw();
  };
  this.forcehide = function () {
    //$('a#savephoto').on('click',function(){
    obj.rotatecw.hide();
    obj.rotateccw.hide();
    obj.close.hide();
    obj.topleft.hide();
    obj.topright.hide();
    obj.bottomright.hide();
    obj.bottomleft.hide();
    obj.layerobj.draw();
    //});
  };

  drawimage.selector = '#editimage';
  this.openpanel = function () {

    //obj.imageobj.off('dblclick dbltap');
    obj.imageobj.on('dblclick dbltap', function () {
      if (gallery.prototype.device == 'tablnet') {
        drawimage.selector = '#editimage';

      } else if (gallery.prototype.device == 'smartphone') {
        drawimage.selector = '#editimagemini';

      }

      obj.getorigin();
      obj.setpanel();
      obj.setrotatepanel();
      obj.setfilterpanel();
      obj.setorder();
      obj.actionpanel();



      //alert('device:'+gallery.prototype.device);

      $(drawimage.selector).popup("open", {
        transition: "slideup",
        positionTo: "window"
      });

    });



    $("#editimage").on({
      popupbeforeposition: function () {
        var h = $(document).height() / 3;
        var w = $(document).width()

        $(this).css({
          "height": h,
          "width": w
        });
      }
    });

    $("#editimagemini").on({
      popupbeforeposition: function () {
        var h = $(document).height() / 2.3;
        var w = $(document).width()

        $(this).css({
          "height": h,
          "width": w
        });
      }
    });

  };
  this.setpanel = function () {
    var degree = this.imageobj.getRotationDeg();
    if (degree < 0) {
      degree += 360;
    }
    //var levellayer = obj.layerobj.getZIndex();
    $(drawimage.selector + ' input#rotate').off();
    $(drawimage.selector + ' input#rotate').val(degree).slider('refresh');
    $(drawimage.selector + ' select#effects').off();
    $(drawimage.selector + ' select#effects').val('').selectmenu('refresh');


  };
  this.setrotatepanel = function () {
    $(drawimage.selector + ' input#rotate').off();
    $(drawimage.selector + ' input#rotate').on('change', function () {
      var angle = $(this).val();
      obj.imageobj.setRotationDeg(angle);
      obj.updatenavbar();
      obj.setrotate(angle / obj.degree);

      obj.layerobj.draw();
    });


  };
  this.setfilterpanel = function () {
    var state = obj.getstateimage();
    $(drawimage.selector + ' select#effects').off();
    $(drawimage.selector + ' select#effects').on('change', function () {
      var value = $(this).val();

      switch (value) {
        case 'Grayscale':
          obj.setstateimage(state);
          //obj.layerobj.draw();
          /*  obj.imageobj.applyFilter({
            filter: Kinetic.Filters.Grayscale,
            callback: function () {
              obj.layerobj.draw(); // vẽ lại layer
            }
          });*/
          // sửa lại cho phiên bản Kineticjs từ 4.1+
          obj.imageobj.applyFilter(Kinetic.Filters.Grayscale, null, function () {
            obj.layerobj.draw(); // vẽ lại layer
          });
          break;
        case 'Invert':
          obj.setstateimage(state);
          //obj.layerobj.draw();
          /*   obj.imageobj.applyFilter({
            filter: Kinetic.Filters.Invert,
            callback: function () {
              obj.layerobj.draw(); // vẽ lại layer
            }
          });*/
          // sửa lại cho phiên bản Kineticjs từ 4.1+
          obj.imageobj.applyFilter(Kinetic.Filters.Invert, null, function () {
            obj.layerobj.draw(); // vẽ lại layer
          });
          break;
        case 'Brighten':
          obj.setstateimage(state);
          /*obj.imageobj.applyFilter({
            config: {
              val: 50
            },
            filter: Kinetic.Filters.Brighten,
            callback: function () {
              obj.layerobj.draw(); // vẽ lại layer
            }
          });*/
          // sửa lại cho phiên bản Kineticjs từ 4.1+
          obj.imageobj.applyFilter(Kinetic.Filters.Brighten, {
            val: 50
          }, function () {
            obj.layerobj.draw(); // vẽ lại layer
          });
          break;
        case 'Darken':
          obj.setstateimage(state);
          /*obj.imageobj.applyFilter({
            config: {
              val: -50
            },
            filter: Kinetic.Filters.Brighten,
            callback: function () {
              obj.layerobj.draw(); // vẽ lại layer
            }
          });*/
          // sửa lại cho phiên bản Kineticjs từ 4.1+
          obj.imageobj.applyFilter(Kinetic.Filters.Brighten, {
            val: -50
          }, function () {
            obj.layerobj.draw(); // vẽ lại layer
          });
          break;
        default:
          //alert('done');
          obj.setstateimage(state);
          obj.layerobj.draw();
      }
      $(this).val(value).selectmenu('refresh');
    });
  };
  this.getorigin = function () {
    $(drawimage.selector).off('popupafteropen');
    $(drawimage.selector).on({
      popupafteropen: function (event, ui) {
        obj.originimage = obj.getstateimage();
        obj.originangle = obj.imageobj.getRotationDeg();
        obj.originorder = obj.layerobj.getZIndex();
      }
    });
  };

  this.saveaction = function () {
    var state = obj.getstateimage();
    var angle = obj.imageobj.getRotationDeg();
    var order = obj.layerobj.getZIndex();
    if (angle < 0) {
      angle += 360;
    }

    obj.setstateimage(state);
    obj.imageobj.setRotationDeg(angle);
    obj.layerobj.setZIndex(order);
    //obj.setrotate();
    $(drawimage.selector).off('popupafterclose');
    $(drawimage.selector).popup("close");
  }

  this.setorigin = function () {
    var origin = obj.originimage;
    var angle = obj.originangle;
    var order = obj.originorder;
    obj.setstateimage(origin);
    obj.imageobj.setRotationDeg(angle);
    obj.layerobj.setZIndex(order);
    //obj.setrotate();
    obj.layerobj.draw();
    if (angle < 0) {
      angle += 360;
    }
    $(drawimage.selector + ' input#rotate').val(angle).slider('refresh');
    $(drawimage.selector + ' select#effects').val('').selectmenu('refresh');


  };
  this.actionpanel = function () {

    $(drawimage.selector + ' a#cancel_editimage').off();
    $(drawimage.selector + ' a#cancel_editimage').on('tap', function () {
      obj.setorigin();
      //obj.layerobj.draw();
    });
    $(drawimage.selector).off('popupafterclose');
    $(drawimage.selector).on({
      popupafterclose: function (event, ui) {
        obj.setorigin();
        //obj.layerobj.draw();
      }
    });

    $(drawimage.selector + ' a#submit_editimage').off();
    $(drawimage.selector + ' a#submit_editimage').on('tap', function () {
      obj.saveaction();
      //obj.layerobj.draw();
    });

  };
  this.setorder = function () {
    $(drawimage.selector + ' a#front').off();
    $(drawimage.selector + ' a#front').on('tap', function () {
      obj.layerobj.moveToTop();

      //drawimage.stage.draw();

    });
    $(drawimage.selector + ' a#back').off();
    $(drawimage.selector + ' a#back').on('tap', function () {
      obj.layerobj.moveToBottom();
      //drawimage.stage.draw();

    });
    $(drawimage.selector + ' a#forward').off();
    $(drawimage.selector + ' a#forward').on('tap', function () {
      obj.layerobj.moveUp();
      //alert(obj.layerobj.getZIndex());
      //drawimage.stage.draw();

    });
    $(drawimage.selector + ' a#backward').off();
    $(drawimage.selector + ' a#backward').on('tap', function () {
      obj.layerobj.moveDown();
      //drawimage.stage.draw();

    });

  };
  this.getstateimage = function () {
    var state = this.imageobj.getImage();
    return state;
  };
  this.setstateimage = function (state) {
    this.imageobj.setImage(state);
  };
  this.addnavbar = function () {
    var close_path = "navbar/fancy_close.png";
    var rotatecw_path = "navbar/rotate-cw_sticker.png";
    var rotateccw_path = "navbar/rotate-ccw_sticker.png";

    var close = this.loadnavbar(close_path, 'close');
    var rotatecw = this.loadnavbar(rotatecw_path, 'rotatecw');
    var rotateccw = this.loadnavbar(rotateccw_path, 'rotateccw');
    close.done(function (navbar) {
      navbar.on("tap click", function () {
        // var image = obj.imageobj;
        var index = $.inArray(obj, drawobjs);
        if (index > -1) {
          drawobjs.remove(index);
        }
        obj.layerobj.remove();
      });
    });
    var cw_clicks = 1;
    var ccw_clicks = -1;

    rotatecw.done(function (navbar) {
      navbar.on("tap click", function () {
        obj.imageobj.setRotationDeg(obj.degree * cw_clicks);

        obj.updatenavbar();

        obj.setrotate(cw_clicks);

        ccw_clicks = cw_clicks - 1;
        cw_clicks++;
      });
    });

    rotateccw.done(function (navbar) {
      navbar.on("tap click", function () {
        obj.imageobj.setRotationDeg(obj.degree * ccw_clicks);

        obj.updatenavbar();

        obj.setrotate(ccw_clicks);

        cw_clicks = ccw_clicks + 1;
        ccw_clicks--;
      });
    });



  };
  this.degree = 10;
  this.setrotate = function (value) {
    var angle = (this.degree * value) * Math.PI / 180;
    var width = obj.imageobj.getWidth();
    var height = obj.imageobj.getHeight();
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);

    var topLeft = obj.topleft;
    var topRight = obj.topright;
    var bottomRight = obj.bottomright;
    var bottomLeft = obj.bottomleft;

    var offsety_topright = Math.round(-width * sin);
    var offsetx_topright = Math.round(width * (1 - cos));
    topRight.setOffset(offsetx_topright, offsety_topright);


    var offsetx_bottomleft = Math.round(height * sin);
    var offsety_bottomleft = Math.round(height * (1 - cos));
    bottomLeft.setOffset(offsetx_bottomleft, offsety_bottomleft);

    var offsetx_bottomright = Math.round(width * (1 - cos) + height * sin);
    var offsety_bottomright = Math.round(-width * sin + height * (1 - cos));
    bottomRight.setOffset(offsetx_bottomright, offsety_bottomright);

  };
  /* this.rotatecw_x = '';
		 this.rotatecw_y = '';
		 this.rotateccw_x = '';
		 this.rotateccw_y = '';
		 this.close_x = '';
		 this.close_y = '';*/

  this.loadnavbar = function (path, name) {

    var state = $.Deferred();

    var imgx = obj.imageobj.getX();
    var imgy = obj.imageobj.getY();
    var width = obj.imageobj.getWidth();
    var button = new Image();
    button.onload = function () {

      if (name == 'rotatecw') {
        var x = (imgx + width - button.width) / 2;
        var y = (imgy - 10 - button.height);
        /* this.rotatecw_x = x;
					 this.rotatecw_y = y;*/
      } else if (name == 'rotateccw') {
        var x = (imgx + width - button.width) / 2 - 10 - button.width;
        var y = (imgy - 10 - button.height);
        /* this.rotateccw_x = x;
					 this.rotateccw_y = y;*/
      } else if (name == 'close') {
        var x = (imgx + width - button.width + 2) / 2 + 10 + button.width;
        var y = (imgy - 10 - button.height) + 2;
        /*this.close_x = x;
					 this.close_y = y;*/
      }
      var navbar = new Kinetic.Image({
        x: x,
        y: y,
        image: button,
        name: name
      });
      obj.groupobj.add(navbar);

      if (name == 'rotatecw') {
        obj.rotatecw = navbar;
      } else if (name == 'rotateccw') {
        obj.rotateccw = navbar;
      } else if (name == 'close') {
        obj.close = navbar;
      }

      state.resolve(navbar);

    };
    button.src = path;

    return state.promise();

  };

  this.updatenavbar = function () {
    var angle = obj.imageobj.getRotation();
    var imgx = (obj.imageobj.getX());
    var imgy = (obj.imageobj.getY());
    //var imgx = obj.imageobj.getAbsolutePosition().x;
    //var imgy = obj.imageobj.getAbsolutePosition().y;
    var width = (obj.imageobj.getWidth());
    var height = (obj.imageobj.getHeight());
    // console.log(obj.groupobj.getPosition());
    //console.log('imgx:' + imgx + ' imgy:' + imgy + ' width:' + width);

    obj.rotatecw.setX((imgx + width - 32) / 2);
    obj.rotatecw.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.rotatecw, (imgx + width - 32) / 2, imgy - 10 - 32, angle);

    obj.rotateccw.setX((imgx + width - 32) / 2 - 10 - 32);
    obj.rotateccw.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.rotateccw, (imgx + width - 32) / 2 - 10 - 32, imgy - 10 - 32, angle);

    obj.close.setX((imgx + width - 32) / 2 + 10 + 32);
    obj.close.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.close, (imgx + width - 32) / 2 + 10 + 32, imgy - 10 - 32, angle);

  };

  this.offsetnavbar = function (navbar, x, y, angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var offsetx = x * (1 - cos) + y * sin;
    var offsety = -x * sin + y * (1 - cos);
    navbar.setOffset(offsetx, offsety);
  };

}
drawimage.prototype.scale = function () {
  var w = drawimage.stage.getWidth() / 2;
  var h = drawimage.stage.getHeight() / 2;
  var ratio = Math.min(w / this.width, h / this.height);
  if (ratio < 1) {
    this.width = ratio * this.width;
    this.height = ratio * this.height;
  }
};


function makedrawtext(stage) {
  $('a#opentextpanel').on('click', function () {
    var textobject = new drawtext(stage);

    drawobjs.push(textobject);
    textobject.action();
    textobject.removeevent();



    $(drawtext.selector).popup('open', {
      transition: "slideup",
      positionTo: "window"
    });
    //console.log(textobject);
  });

  $("#textpanel").on({
    popupbeforeposition: function () {
      var h = $(document).height() / 1.95;
      var w = $(document).width()

      $(this).css({
        "height": h,
        "width": w
      });
    }
  });
  $("#textpanelmini").on({
    popupbeforeposition: function () {
      var h = $(document).height() / 1.7;
      var w = $(document).width()

      $(this).css({
        "height": h,
        "width": w
      });
    }
  });

  //S('.color-picker').miniColors();
}

function drawtext(stage) {
  var obj = this;
  var stage = stage;
  this.x = $(document).width() / 2;
  this.y = $(document).height() / 2;
  this.string = '';
  this.fontsize = 18;
  this.fontfamily = 'System font';
  this.color = '#d64400';
  this.fontstyle = 'normal';
  this.strokewidth = 0;
  this.strokecolor = '#ffffff';
  this.backgroudcolor = 'rgba(255, 255, 255, 0)';
  this.padding = 10;
  this.textobj = null;
  drawtext.selector = 'tablnet';
  this.layerobj = '';

  //this.coloropt = 1;
  //this.strokecoloropt = 0;
  this.backgroudcoloropt = 0;

  // this.colorhex = '#d64400';
  //this.strokecolorhex = '#ffffff';
  this.backgroudcolorhex = '#ffffff';

  this.rotatecw = '';
  this.rotateccw = '';
  this.close = '';


  this.getselector = function () {
    if (gallery.prototype.device == 'tablnet') {
      drawtext.selector = '#textpanel';

    } else if (gallery.prototype.device == 'smartphone') {
      drawtext.selector = '#textpanelmini';

    }
  };
  this.setpanel = function () {
    this.string = this.textobj.getText();
    this.fontfamily = this.textobj.getFontFamily();
    this.fontstyle = this.textobj.getFontStyle();
    this.fontsize = this.textobj.getFontSize();
    this.strokewidth = this.textobj.getStrokeWidth() || 0;

    this.color = this.textobj.getTextFill() || '#d64400';
    this.strokecolor = this.textobj.getStroke() || '#ffffff';
    this.backgroudcolor = this.textobj.getFill() || 'rgba(255, 255, 255, 0)';

    //console.log(this.color);
    //this.colorhex = this.rgba2hex(this.color).hex;
    // this.coloropt = this.rgba2hex(this.color).opt;

    //this.strokecolorhex = this.rgba2hex(this.strokecolor).hex;
    //this.strokeopt = this.rgba2hex(this.strokecolor).opt;

    this.backgroudcolorhex = this.rgba2hex(this.backgroudcolor).hex;
    this.backgroudcoloropt = this.rgba2hex(this.backgroudcolor).opt;


    $(drawtext.selector + ' textarea#text').off();
    $(drawtext.selector + ' textarea#text').val(this.string);
    $(drawtext.selector + ' select#fontfamily').off();
    $(drawtext.selector + ' select#fontfamily').val(this.fontfamily).selectmenu('refresh');
    $(drawtext.selector + ' input[name="fontstyle"]').off();
    $(drawtext.selector + ' input[name="fontstyle"]').attr('checked', false).checkboxradio("refresh");
    $(drawtext.selector + ' input[name="fontstyle"]').off();
    $(drawtext.selector + ' input[value="' + this.fontstyle + '"]').attr('checked', true).checkboxradio("refresh");
    $(drawtext.selector + ' input#fontsize').off();
    $(drawtext.selector + ' input#fontsize').val(this.fontsize).slider('refresh');
    $(drawtext.selector + ' input#strokewidth').off();
    $(drawtext.selector + ' input#strokewidth').val(this.strokewidth).slider('refresh');

    $(drawtext.selector + ' input#textcolor').miniColors('destroy');
    $(drawtext.selector + ' input#textcolor').miniColors();
    // $(drawtext.selector + ' input#textcolor').miniColors({opacity: true});
    $(drawtext.selector + ' input#textcolor').miniColors('value', this.color);
    //$(drawtext.selector + ' input#textcolor').miniColors('opacity', this.coloropt);



    $(drawtext.selector + ' input#strokecolor').miniColors('destroy');
    $(drawtext.selector + ' input#strokecolor').miniColors();
    //$(drawtext.selector + ' input#strokecolor').miniColors({opacity: true});
    $(drawtext.selector + ' input#strokecolor').miniColors('value', this.strokecolor);
    // $(drawtext.selector + ' input#strokecolor').miniColors('opacity', this.strokecoloropt);

    $(drawtext.selector + ' input#backgroudcolor').miniColors('destroy');
    //$(drawtext.selector + ' input#backgroudcolor').miniColors();
    $(drawtext.selector + ' input#backgroudcolor').miniColors({
      opacity: true
    });
    $(drawtext.selector + ' input#backgroudcolor').miniColors('value', this.backgroudcolorhex);
    $(drawtext.selector + ' input#backgroudcolor').miniColors('opacity', this.backgroudcoloropt);




  };

  this.rgba2hex = function (src) {
    var check = /^rgba/;
    if (src.search(check) >= 0) {
      var hex = /[0-9]+(?=,|$)/g;
      var opt = /(\d+(\.\d{1,2})?)+(?=\)|$)/g;
      var hexarr = src.match(hex);
      var optarr = src.match(opt);
      var r = parseInt(hexarr[0]);
      var g = parseInt(hexarr[1]);
      var b = parseInt(hexarr[2]);
      var opt = parseFloat(optarr[0]);
      var hexstring = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      return {
        'hex': hexstring,
        'opt': opt
      };
    }
    return null;
  };

  this.onchange = function () {

    $(drawtext.selector + ' textarea#text').off();
    $(drawtext.selector + ' textarea#text').on('change', function () {
      var string = $(this).val();
      obj.textobj.setText(string);
      obj.layerobj.draw();
    });

    $(drawtext.selector + ' select#fontfamily').off();
    $(drawtext.selector + ' select#fontfamily').on('change', function () {
      var fontfamily = $(this).val();
      $(this).val(fontfamily).selectmenu('refresh');
      obj.textobj.setFontFamily(fontfamily);
      obj.layerobj.draw();
    });

    $(drawtext.selector + ' input[name="fontstyle"]').off();
    $(drawtext.selector + ' input[name="fontstyle"]').on('change', function () {
      //$(drawtext.selector + ' input[name="fontstyle"]').attr('checked', false).checkboxradio("refresh");
      var fontstyle = $(drawtext.selector + ' input[name="fontstyle"]:checked').val();
      // $(drawtext.selector + ' input[value="' + fontstyle + '"]').attr('checked', true).checkboxradio("refresh");
      obj.textobj.setFontStyle(fontstyle);
      obj.layerobj.draw();
    });

    $(drawtext.selector + ' input#fontsize').off();
    $(drawtext.selector + ' input#fontsize').on('change', function () {
      var fontsize = $(this).val();
      obj.textobj.setFontSize(fontsize);
      obj.updatenavbar();
      obj.layerobj.draw();
    });

    $(drawtext.selector + ' input#strokewidth').off();
    $(drawtext.selector + ' input#strokewidth').on('change', function () {
      var strokewidth = $(this).val();
      obj.textobj.setStrokeWidth(strokewidth);
      obj.layerobj.draw();
    });

    $(drawtext.selector + ' input#textcolor').miniColors('destroy');
    //$(drawtext.selector + ' input#textcolor').miniColors();
    $(drawtext.selector + ' input#textcolor').miniColors({
      //opacity: true,
      change: function (hex, rgba) {
        //var color = 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')';
        var color = hex;
        obj.textobj.setTextFill(color);
        obj.layerobj.draw();
        //return false;
      }
    });
    $(drawtext.selector + ' input#textcolor').miniColors('value', this.color);
    //$(drawtext.selector + ' input#textcolor').miniColors('opacity', this.coloropt);

    $(drawtext.selector + ' input#strokecolor').miniColors('destroy');
    //$(drawtext.selector + ' input#strokecolor').miniColors();

    $(drawtext.selector + ' input#strokecolor').miniColors({
      //opacity: true,
      change: function (hex, rgba) {
        //var strokecolor = 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')';
        var strokecolor = hex;
        obj.textobj.setStroke(strokecolor);
        obj.layerobj.draw();
        //return false;
      }
    });
    $(drawtext.selector + ' input#strokecolor').miniColors('value', this.strokecolor);
    //$(drawtext.selector + ' input#strokecolor').miniColors('opacity', this.strokecoloropt);

    $(drawtext.selector + ' input#backgroudcolor').miniColors('destroy');
    // $(drawtext.selector + ' input#backgroudcolor').miniColors();
    $(drawtext.selector + ' input#backgroudcolor').miniColors({
      opacity: true,
      change: function (hex, rgba) {
        var backgroudcolor = 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')';
        obj.textobj.setFill(backgroudcolor);
        obj.layerobj.draw();
        //return false;
      }
    });
    $(drawtext.selector + ' input#backgroudcolor').miniColors('value', this.backgroudcolorhex);
    $(drawtext.selector + ' input#backgroudcolor').miniColors('opacity', this.backgroudcoloropt);


  };
  this.action = function () {
    this.getselector();
    if (obj.textobj != null) {
      obj.onchange();
    } else {
      /* obj.insertonchange();
			 console.log('obj.insertonchange()');*/
    }
    $(drawtext.selector + ' a#submit_textpanel').off();
    $(drawtext.selector + ' a#submit_textpanel').on('tap', function () {
      obj.getconfig();
      if (obj.textobj == null) {
        obj.createtextobj();
      } else {
        //obj.onchange();
        obj.settextobj();
      }
      obj.deleteemptyobj();
      $(drawtext.selector).off();
      $(drawtext.selector).popup('close');
      $('a#opentextpanel').removeClass('ui-btn-active');

    });
    $(drawtext.selector + ' a#cancel_textpanel').off();
    $(drawtext.selector + ' a#cancel_textpanel').on('tap', function () {

      if (obj.textobj != null) {
        obj.getorigin();
        obj.settextobj();
      }
      obj.setinitpanel();
      if (obj.textobj != null) {
        obj.onchange();
      } else {
        /*obj.insertonchange();*/
      }
    });

    $(drawtext.selector).off('popupafterclose');
    $(drawtext.selector).on({
      popupafterclose: function (event, ui) {
        $('a#opentextpanel').removeClass('ui-btn-active');
        $(drawtext.selector + ' a#cancel_textpanel').trigger('tap');
        obj.deleteemptyobj();
      }
    });

  };
  this.removeevent = function () {

    $(drawtext.selector + ' textarea#text').off();
    $(drawtext.selector + ' select#fontfamily').off();
    $(drawtext.selector + ' select#fontfamily').on('change', function () {
      var fontfamily = $(this).val();
      //alert(fontfamily);
      $(this).val(fontfamily).selectmenu('refresh');
    });
    $(drawtext.selector + ' input[name="fontstyle"]').off();
    $(drawtext.selector + ' input#fontsize').off();
    $(drawtext.selector + ' input#strokewidth').off();

    $(drawtext.selector + ' input#textcolor').miniColors('destroy');
    $(drawtext.selector + ' input#textcolor').miniColors();
    //$(drawtext.selector + ' input#textcolor').miniColors({opacity: true});
    $(drawtext.selector + ' input#textcolor').miniColors('value', this.color);
    //$(drawtext.selector + ' input#textcolor').miniColors('opacity',this.coloropt);



    $(drawtext.selector + ' input#strokecolor').miniColors('destroy');
    $(drawtext.selector + ' input#strokecolor').miniColors();
    // $(drawtext.selector + ' input#strokecolor').miniColors({opacity: true});
    $(drawtext.selector + ' input#strokecolor').miniColors('value', this.strokecolor);
    // $(drawtext.selector + ' input#strokecolor').miniColors('opacity',this.strokecoloropt);

    $(drawtext.selector + ' input#backgroudcolor').miniColors('destroy');
    //$(drawtext.selector + ' input#backgroudcolor').miniColors();
    $(drawtext.selector + ' input#backgroudcolor').miniColors({
      opacity: true
    });
    $(drawtext.selector + ' input#backgroudcolor').miniColors('value', this.backgroudcolorhex);
    $(drawtext.selector + ' input#backgroudcolor').miniColors('opacity', this.backgroudcoloropt);

  };
  this.deleteemptyobj = function () {
    if (this.string == '' || this.textobj == null) {
      var index = $.inArray(obj, drawobjs);
      if (index > -1) {
        drawobjs.remove(index);
      }

      if (this.textobj != null) {
        obj.layerobj.remove();
      }
      delete obj;
    }
  };
  this.setinitpanel = function () {

    $(drawtext.selector + ' textarea#text').off();
    $(drawtext.selector + ' textarea#text').val(this.string);

    $(drawtext.selector + ' select#fontfamily').off();
    $(drawtext.selector + ' select#fontfamily').val(this.fontfamily).selectmenu('refresh');
    $(drawtext.selector + ' select#fontfamily').on('change', function () {
      var fontfamily = $(this).val();
      //alert(fontfamily);
      $(this).val(fontfamily).selectmenu('refresh');
    });
    $(drawtext.selector + ' input[name="fontstyle"]').off();
    $(drawtext.selector + ' input[name="fontstyle"]').attr('checked', false).checkboxradio("refresh");
    $(drawtext.selector + ' input[value="' + this.fontstyle + '"]').off();
    $(drawtext.selector + ' input[value="' + this.fontstyle + '"]').attr('checked', true).checkboxradio("refresh");
    $(drawtext.selector + ' input#fontsize').off();
    $(drawtext.selector + ' input#fontsize').val(this.fontsize).slider('refresh');
    $(drawtext.selector + ' input#strokewidth').off();
    $(drawtext.selector + ' input#strokewidth').val(this.strokewidth).slider('refresh');

    //$(drawtext.selector + ' input#textcolor').miniColors('destroy');
    //$(drawtext.selector + ' input#textcolor').miniColors();
    $(drawtext.selector + ' input#textcolor').miniColors('value', this.color);
    //$(drawtext.selector + ' input#textcolor').miniColors('opacity', this.coloropt);

    // $(drawtext.selector + ' input#strokecolor').miniColors('destroy');
    //$(drawtext.selector + ' input#strokecolor').miniColors();
    $(drawtext.selector + ' input#strokecolor').miniColors('value', this.strokecolor);
    //$(drawtext.selector + ' input#textcolor').miniColors('opacity', this.strokecoloropt);

    //$(drawtext.selector + ' input#backgroudcolor').miniColors('destroy');
    //$(drawtext.selector + ' input#backgroudcolor').miniColors();
    //$(drawtext.selector + ' input#backgroudcolor').miniColors({opacity: true});
    $(drawtext.selector + ' input#backgroudcolor').miniColors('value', this.backgroudcolorhex);
    $(drawtext.selector + ' input#textcolor').miniColors('opacity', this.backgroudcoloropt);


  };
  this.getconfig = function () {

    this.string = $(drawtext.selector + ' textarea#text').val();
    this.fontfamily = $(drawtext.selector + ' select#fontfamily').val();
    this.fontstyle = $(drawtext.selector + ' input[name="fontstyle"]:checked').val();
    this.fontsize = $(drawtext.selector + ' input#fontsize').val();
    this.strokewidth = $(drawtext.selector + ' input#strokewidth').val();


    // this.backgroudcolor = $(drawtext.selector + ' input#backgroudcolor').next('span.miniColors-triggerWrap').find('a').css('background-color');
    this.backgroudcoloropt = $(drawtext.selector + ' input#backgroudcolor').miniColors('opacity');
    this.backgroudcolorhex = $(drawtext.selector + ' input#backgroudcolor').miniColors('value');
    this.backgroudcolor = this.hex2rgba(this.backgroudcolorhex, this.backgroudcoloropt);

    //this.color = $(drawtext.selector + ' input#textcolor').next('span.miniColors-triggerWrap').find('a').css('background-color');
    //this.coloropt = $(drawtext.selector + ' input#textcolor').miniColors('opacity');
    this.color = $(drawtext.selector + ' input#textcolor').miniColors('value');

    //this.strokecolor = $(drawtext.selector + ' input#strokecolor').next('span.miniColors-triggerWrap').find('a').css('background-color');
    //this.strokecoloropt = $(drawtext.selector + ' input#strokecolor').miniColors('opacity');
    this.strokecolor = $(drawtext.selector + ' input#strokecolor').miniColors('value');


  };

  this.hex2rgba = function (hex, opt) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);
    var a = parseFloat(opt);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  };

  this.settextobj = function () {
    obj.textobj.setText(this.string);
    obj.textobj.setTextFill(this.color);
    obj.textobj.setFontFamily(this.fontfamily);
    obj.textobj.setFontStyle(this.fontstyle);
    obj.textobj.setFontSize(this.fontsize);
    obj.textobj.setFill(this.backgroudcolor);
    obj.textobj.setStrokeWidth(this.strokewidth);
    obj.textobj.setStroke(this.strokecolor);
    obj.updatenavbar();
    obj.layerobj.draw();
    //obj.onchange(); 
  };
  this.getorigin = function () {

    $(drawtext.selector).off('popupafteropen');

    $(drawtext.selector).on({
      popupafteropen: function (event, ui) {
        obj.string = obj.textobj.getText();
        obj.fontfamily = obj.textobj.getFontFamily();
        obj.fontstyle = obj.textobj.getFontStyle();
        obj.fontsize = obj.textobj.getFontSize();
        obj.strokewidth = obj.textobj.getStrokeWidth() || 0;

        obj.color = obj.textobj.getTextFill();
        obj.strokecolor = obj.textobj.getStroke() || '#ffffff';
        obj.backgroudcolor = obj.textobj.getFill() || 'rgba(255, 255, 255, 0)';

        //obj.colorhex = obj.rgba2hex(obj.color).hex;
        //obj.coloropt = obj.rgba2hex(obj.color).opt;

        //obj.strokecolorhex = obj.rgba2hex(obj.strokecolor).hex;
        //obj.strokeopt = this.rgba2hex(obj.strokecolor).opt;

        obj.backgroudcolorhex = obj.rgba2hex(obj.backgroudcolor).hex;
        obj.backgroudcoloropt = obj.rgba2hex(obj.backgroudcolor).opt;
      }
    });

  };

  this.createtextobj = function () {
    var layer = new Kinetic.Layer();
    var groups = new Kinetic.Group({
      x: this.x,
      y: this.y,
      draggable: true
    });
    var textobj = new Kinetic.Text({
      x: 0,
      y: 0,
      text: this.string,
      fontSize: this.fontsize,
      fill: this.backgroudcolor,
      fontFamily: this.fontfamily,
      textFill: this.color,
      fontStyle: this.fontstyle,
      draggable: true,
      strokeWidth: this.strokewidth,
      stroke: this.strokecolor,
      lineJoin: 'bevel',
      lineCap: 'round',
      padding: 10
    });

    groups.add(textobj);
    layer.add(groups);

    this.textobj = textobj;
    this.groupobj = groups;
    this.layerobj = layer;
    this.addnavbar();

    //this.forcehide();

    this.groupobj.on('dragstart', function () {
      obj.layerobj.moveToTop();

    });

    this.textobj.on("tap click", function () {
      var layer = this.getLayer();
      var rotatecw = obj.rotatecw;
      var rotateccw = obj.rotateccw;
      var close = obj.close;
      if (close.isVisible()) {
        rotatecw.hide();
        rotateccw.hide();
        close.hide();
      } else {
        rotatecw.show();
        rotateccw.show();
        close.show();
      }

    });

    this.textobj.on('dblclick dbltap', function () {
      obj.setpanel();
      //obj.setinit();
      obj.action();
      //obj.onchange();
      $(drawtext.selector).popup('open', {
        transition: "slideup",
        positionTo: "window"
      });
    });

    stage.add(layer);
    stage.draw();
  };

  this.forcehide = function () {
    //$('a#savephoto').on('click tap',function(){
    obj.rotatecw.hide();
    obj.rotateccw.hide();
    obj.close.hide();
    obj.layerobj.draw();
    //});
  };

  this.degree = 10;

  this.addnavbar = function () {
    var close_path = "navbar/fancy_close.png";
    var rotatecw_path = "navbar/rotate-cw_sticker.png";
    var rotateccw_path = "navbar/rotate-ccw_sticker.png";

    var close = this.loadnavbar(close_path, 'close');
    var rotatecw = this.loadnavbar(rotatecw_path, 'rotatecw');
    var rotateccw = this.loadnavbar(rotateccw_path, 'rotateccw');
    close.done(function (navbar) {
      navbar.on("tap click", function () {
        //var textobj = obj.textobj;
        var index = $.inArray(obj, drawobjs);
        if (index > -1) {
          drawobjs.remove(index);
        }
        obj.layerobj.remove();
      });
    });
    var cw_clicks = 1;
    var ccw_clicks = -1;

    rotatecw.done(function (navbar) {
      navbar.on("tap click", function () {
        obj.textobj.setRotationDeg(obj.degree * cw_clicks);

        obj.updatenavbar();

        //obj.setrotate(cw_clicks);

        ccw_clicks = cw_clicks - 1;
        cw_clicks++;
      });
    });

    rotateccw.done(function (navbar) {
      navbar.on("tap click", function () {
        obj.textobj.setRotationDeg(obj.degree * ccw_clicks);

        obj.updatenavbar();

        //obj.setrotate(ccw_clicks);

        cw_clicks = ccw_clicks + 1;
        ccw_clicks--;
      });
    });
  };

  this.loadnavbar = function (path, name) {

    var state = $.Deferred();

    var imgx = obj.textobj.getX();
    var imgy = obj.textobj.getY();
    var width = obj.textobj.getWidth();

    var button = new Image();
    button.onload = function () {

      if (name == 'rotatecw') {
        var x = (imgx + width - button.width) / 2;
        var y = (imgy - 10 - button.height);
        /* this.rotatecw_x = x;
					 this.rotatecw_y = y;*/
      } else if (name == 'rotateccw') {
        var x = (imgx + width - button.width) / 2 - 10 - button.width;
        var y = (imgy - 10 - button.height);
        /* this.rotateccw_x = x;
					 this.rotateccw_y = y;*/
      } else if (name == 'close') {
        var x = (imgx + width - button.width + 2) / 2 + 10 + button.width;
        var y = (imgy - 10 - button.height) + 2;
        /*this.close_x = x;
					 this.close_y = y;*/
      }
      var navbar = new Kinetic.Image({
        x: x,
        y: y,
        image: button,
        name: name
      });
      obj.groupobj.add(navbar);

      if (name == 'rotatecw') {
        obj.rotatecw = navbar;
      } else if (name == 'rotateccw') {
        obj.rotateccw = navbar;
      } else if (name == 'close') {
        obj.close = navbar;
      }

      state.resolve(navbar);

    };
    button.src = path;

    return state.promise();

  };

  this.updatenavbar = function () {
    var angle = obj.textobj.getRotation();
    var imgx = (obj.textobj.getX());
    var imgy = (obj.textobj.getY());
    var width = (obj.textobj.getWidth());
    var height = (obj.textobj.getHeight());

    obj.rotatecw.setX((imgx + width - 32) / 2);
    obj.rotatecw.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.rotatecw, (imgx + width - 32) / 2, imgy - 10 - 32, angle);

    obj.rotateccw.setX((imgx + width - 32) / 2 - 10 - 32);
    obj.rotateccw.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.rotateccw, (imgx + width - 32) / 2 - 10 - 32, imgy - 10 - 32, angle);

    obj.close.setX((imgx + width - 32) / 2 + 10 + 32);
    obj.close.setY((imgy - 10 - 32));
    obj.offsetnavbar(obj.close, (imgx + width - 32) / 2 + 10 + 32, imgy - 10 - 32, angle);

  };

  this.offsetnavbar = function (navbar, x, y, angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var offsetx = x * (1 - cos) + y * sin;
    var offsety = -x * sin + y * (1 - cos);
    navbar.setOffset(offsetx, offsety);
  };

}

function sharefacebook() {
  var state_savephoto = savephoto();
  //var string = base64;
  //var copyright = '- được tạo bởi Sedi';
  var empty = 'Ảnh được chỉnh sửa bởi Sedi!';
  var message = $('textarea#message').val();
  if (message == '') {
    message = empty;
  }
  state_savephoto.done(function (data) {

    // string = string.replace(/^data:image\/(png|jpg);base64,/, "");
    // $.mobile.showPageLoadingMsg();
    var filename = data.filename;
    var string = data.string;
    showloader();
    $.ajax({
      type: "POST",
      url: 'http://trungpolit.freevnn.com/sedi/factory-images.php',
      //url: "http://localhost/sedi-factory/factory-images.php",
      data: {
        name: filename,
        uid: device.uuid,
        imgstring: string
      },
      dataType: "json",
      crossDomain: true,
      error: function () {
        alert('Lỗi Ajax');
      },
      success: function (res) {
        FB.api('/photos', 'post', {
          message: message,
          url: res.dirpath
        }, function (response) {
          console.log(response.error);
          if (!response || response.error) {
            //$.mobile.hidePageLoadingMsg();
            hideloader();
            navigator.notification.alert(
              'Có lỗi xảy ra. Ảnh chưa được chia sẻ thành công!\nBạn vui lòng thử lại!',
            null,
              'Thông báo lỗi',
              'Xác nhận');

          } else {
            //$.mobile.hidePageLoadingMsg();
            hideloader();
            navigator.notification.alert(
              'Ảnh đã được lưu và chia sẻ thành công!',
            null,
              'Thông báo thành công',
              'Xác nhận');

          }
        });
      }

    });

  });

}

function showloader() {
  $.mobile.loading('show', {
    text: 'Đang nạp dữ liệu ...',
    textVisible: true,
    theme: 'a',
    textonly: false,
    html: ''
  });
}

function hideloader() {
  $.mobile.loading('hide');
}