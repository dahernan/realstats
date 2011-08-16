
function setCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function getCookie(name) {
	return getCookie(name, document.cookie);
}

function getCookie(name, cookie) {
	var nameEQ = name + "=";
	var ca = cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

socket.on('connect', function(){
	socket.emit('new_client' , {nav: navigator.userAgent, url: document.URL, referrer: document.referrer});
	$("#status").html("Connected!! :)");
});

socket.on('new_usid', function(data){
	console.log("new_usid" + data.usid);
	setCookie("_usid", data.usid, 365);
});


socket.on('disconnect', function(){ 
	$("#status").html("Disconnected :()");
	socket.emit('destroy_client');
	
})
