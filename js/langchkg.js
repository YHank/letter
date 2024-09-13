chgLng();

// 접속자의 로컬 언어에 따라서 글자를 변환하는 함수.
function chgLng(){
    var lang = navigator.language || navigator.userLanguage;
    if(lang.indexOf('ko') > -1){
    }
    // 일본어
    else if(lang.indexOf('ja') > -1){
    }
    // 중국어
    else if(lang.indexOf('zh') > -1){
    }
    // 영어
    else if(lang.indexOf('en') > -1){

    }
}
