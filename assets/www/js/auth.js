//////////////////////////
//
// Authentication
// See "Logging the user in" on https://developers.facebook.com/mobile
//
//////////////////////////
var user = [];

//Detect when Facebook tells us that the user's session has been returned
function authUser() {
  FB.Event.subscribe('auth.statusChange', handleStatusChange);
}

function handleStatusChange(session) {
  console.log('Got the user\'s session: ', session);

  if (session.authResponse) {
    document.body.className = 'connected';
    //$.mobile.showPageLoadingMsg();
    showloader();
    //Fetch user's id, name, and picture
    FB.api('/me', {
      fields: 'name, picture'
    },

    function (response) {
      if (!response.error) {
        //alert('không hồi đáp');
        user = response;

        console.log('Got the user\'s name and picture: ');
        console.log(response);

        //Update display of user name and picture
        /* 
            * if (document.getElementById('user-name')) {
              document.getElementById('user-name').innerHTML = user.name;
            }
            */

        $('p#user_name').text(user.name);
        //if (document.getElementById('user-picture')) {
        if (user.picture.data) {
          var src = user.picture.data.url;

        } else {
          var src = user.picture;
        }
        // }
        var img = '<img src="' + src + '" />';
        $('#user_avatar').html(img);
      }

      //$.mobile.hidePageLoadingMsg(); 
      $('input#login').val('Đã đăng nhập!');
      $('input#login').button('disable');
      $('input#login').button('refresh');
      $('textarea#message').textinput('enable');
      $('input#share').button('enable');
      hideloader();

    });
  } else {
    //alert('Lỗi không truy cập được facebook. Xin vui lòng đăng nhập lại');
    document.body.className = 'not_connected';
    hideloader();

    //clearAction();
  }
}

//Prompt the user to login and ask for the 'email' permission
function promptLogin() {
  FB.login(null, {
    scope: 'email,user_likes,publish_stream,photo_upload'
  });
}

//This will prompt the user to grant you acess to their Facebook Likes
function promptExtendedPermissions() {
  FB.login(function () {
    setAction("The 'user_likes,publish_stream' permission has been granted.", false);

    setTimeout('clearAction();', 2000);

    document.body.className = 'permissioned';
  }, {
    scope: 'user_likes,publish_stream'
  });
}

//See https://developers.facebook.com/docs/reference/rest/auth.revokeAuthorization/
function uninstallApp() {
  FB.api({
    method: 'auth.revokeAuthorization'
  },

  function (response) {
    // window.location.reload();
    // To clear the local storage cache and native session, call logout
    logout();
  });
}

//See https://developers.facebook.com/docs/reference/javascript/FB.logout/
function logout() {
  FB.logout(function (response) {
    window.location.reload();
    // $('#sharefacebook').trigger("create");
  });
}