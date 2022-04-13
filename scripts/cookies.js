export function getCookie(cname, daily) {
    cname = (daily ? "d_" : "") + cname
    var cookies = ` ${document.cookie}`.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] == ` ${cname}`) {
            return cookie[1];
        }
    }
    return "";
}

export function setCookie(cname, cvalue, exdays, daily) {
    cname = (daily ? "d_" : "") + cname
    const d = new Date();
    if (daily) {
        d.setHours(23,59,59,0)
    } else {
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    }
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/" + ";samesite=strict";
}