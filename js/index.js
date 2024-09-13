document.querySelector('#letter_count').addEventListener('input', function(){
    let letter = this.innerText;
    let letter_count = letter.replace(/ /g, '').replace(/\n/g, '');
    let letter_count2 = letter.length;
    let word_count = letter.split(' ').length;
    let wrod_count2 = letter.split(/\n/).length;
    let line_count = letter.split('\n').length;
    // 한라인에 아무런 글자가 없을경우 1로 카운트 되기 때문에 -1을 해준다.
    let line_count2 = 0;
    letter.split('\n').forEach(function(enter){
        if(enter == ''){
            line_count2++;
        }
    })
    document.querySelector('[data-result="1"]').textContent = letter_count.length;
    document.querySelector('[data-result="2"]').textContent = letter_count2;
    document.querySelector('[data-result="3"]').textContent = word_count+wrod_count2-line_count2-1;
    document.querySelector('[data-result="4"]').textContent = line_count;
});

document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-move]').forEach(function(link){
        link.addEventListener('click', function(e){
            const page = this.dataset.move;
            e.preventDefault();
            $('main').load('/html/'+page+'.html');
        });
    });
});


function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'ko', // 기본 언어 설정
        includedLanguages: 'en,ja,zh-CN,fr,de', // 추가할 언어 코드 목록
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}
