let answers = {};
let questionCount = 0;
let questionCompleted = true;
let personality = undefined;
let musicPath = undefined;
let questionID = undefined;
let userID = undefined;
let foreignID = undefined;

/*-------------------------------------------------------------*/
/*Download and init google analytics*/
/*----------------------+---------------------------------------*/

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-109816817-1', 'auto');
ga('send', 'pageview');

/*-------------------------------------------------------------*/
/*Init JS*/
/*-------------------------------------------------------------*/
$(function () {
    /*Show tooltips*/
    $('[data-toggle="tooltip"]').tooltip();

    /*enable scrollto buttons*/
    $('.scrollto').click(function () {
        let elem = $('#' + $(this).attr('scrollto'));
        $('html, body').animate({
            scrollTop: elem.offset().top
        }, 1000);
    });

    $('#section-main-button button').click(function () {
        startQuestions();
    });

    $('#section-main-actions-download').click(function () {
        downloadMusic();
    });

    $('#section-main-back a').click(function () {
        undoQuestion();
    });

    $('#section-main-answers button').click(function () {
        completeQuestion($(this).children().attr('id')[20]);
    });

    $('#section-main-name button').click(function () {
        completeQuestion($('#section-main-name-input').val());
    });
    
    /*Get statistics from server and notify user on error*/
    $.get('https://www.musicmindproject.com:8443/backend/rest/analytics/pageclicks', function (data, status) {
        if (status !== 'success') printMessage(false, 'Error ' + status, 'Could not request Page clicks from server!');
        else $('#section-statistics-pageclicks').text(data);
    });

    $.get('https://www.musicmindproject.com:8443/backend/rest/analytics/personalitycount', function (data, status) {
        if (status !== 'success') printMessage(false, 'Error ' + status, 'Could not request Personality count from server!');
        else $('#section-statistics-personalitycount').text(data);
    });

    $.get('https://www.musicmindproject.com:8443/backend/rest/analytics/shared', function (data, status) {
        if (status !== 'success') printMessage(false, 'Error ' + status, 'Could not request shares from server!');
        else $('#section-statistics-shared').text(data);
    });

    /*setup contact form and send data to server*/
    let form = $('#section-contact-form');
    form.submit(function (e) {
        e.preventDefault();
        let form = $(this);
        let postData = form.serializeArray();
        let formURL = form.attr('action');
        $.ajax({
            url: formURL,
            type: 'POST',
            data: postData
        });
        form.trigger('reset');
        printMessage(true, 'Thank you!', 'Thank you for your help!');
        ga('send', 'event', 'contact', 'send', postData);
        return false;
    });

    /*animate popping icons*/
    anime({
        targets: ['#section-statistics i'],
        loop: true,
        scale: [
            {value: 1.5, duration: 1000},
            {value: 1, duration: 1000}
        ],
        translateY: [
            {value: -10, duration: 1000},
            {value: 0, duration: 1000}
        ],
        delay: function (el, i) {
            return i * 2000;
        }
    });
    anime({
        targets: ['#section-personality i'],
        loop: true,
        scale: [
            {value: 1.5, duration: 1000},
            {value: 1, duration: 1000}
        ],
        delay: function (el, i) {
            return i * 2000;
        }
    });

    /*Handle other persons music in case of parameters*/
    foreignID = getUrlParameter('id');
    tryShowID(foreignID);

    ga(function(tracker) {
        userID = tracker.get('clientId');
        /*Handle own music in case it already exists*/
        if(foreignID === undefined) {
            tryShowID(userID);
        }
    });
});

function tryShowID(id) {
    if(id !== undefined) {
        $.get('https://www.musicmindproject.com:8443/backend/rest/music/' + id, function (data, status) {
            if (status !== 'success') {
                printMessage('Error ' + status, 'Could not request Question Count from server!');
            } else {
                if(data !== null && data !== 'null') {
                    personality = {
                        'neuroticism': data['neuroticism'],
                        'extraversion': data['extraversion'],
                        'openness': data['openness'],
                        'agreeableness': data['agreeableness'],
                        'conscientiousness': data['conscientiousness']
                    };
                    musicPath = data['pathToMusicTrack'];
                    transitionFromTo(
                        ['#section-main-brain', '#section-main-title', '#section-main-button'],
                        ['#section-main-headline', '#section-main-personality', '#section-main-info', '#section-main-actions']
                    );
                    if(foreignID !== undefined) {
                        $('#section-main-headline h2').text(data['userName'] + '\'s Personality:');
                    }
                    displayPersonality();
                }
            }

        });
    }
}

/*-------------------------------------------------------------*/
/*Hide unused animated header objects*/
/*-------------------------------------------------------------*/
function storeAnimatedObject(id) {
    $('#section-main-animation-object-container').append($(id));
}

/*-------------------------------------------------------------*/
/*Show animated header objects*/
/*-------------------------------------------------------------*/
function getAnimatedObject(id) {
    $('#section-main .content').append($(id));
    anime({
        targets: id,
        translateY: '100vh',
        duration: 0
    });
}

/*-------------------------------------------------------------*/
/*Transition between header animation objects*/
/*-------------------------------------------------------------*/
function transitionFromTo(from, to) {
    anime({
        targets: from,
        translateY: '100vh',
        easing: 'easeInQuad',
        duration: 500,
        complete: function (anim) {
            $.each(from, function (index, value) {
                storeAnimatedObject(value);
            });
            $.each(to, function (index, value) {
                getAnimatedObject(value);
            });
            anime({
                targets: to,
                translateY: '0vh',
                easing: 'easeInQuad',
                duration: 500
            });
        }
    });
}

/*-------------------------------------------------------------*/
/*Print error and success messages to user*/
/*-------------------------------------------------------------*/
function printMessage(positive, title, message) {
    if(!positive) ga('send', 'error', title + ":\n" + message);

    $('#section-modal-title').text(title);
    $('#section-modal-text').text(message);
    $('#section-modal-button').addClass(positive ? 'btn-success' : 'btn-danger');
    $('#section-modal-button').removeClass(positive ? 'btn-danger' : 'btn-success');
    $('#section-modal').modal();
}

/*-------------------------------------------------------------*/
/*Show question form*/
/*-------------------------------------------------------------*/
function startQuestions() {
    transitionFromTo(
        ['#section-main-brain', '#section-main-title', '#section-main-button'],
        ['#section-main-question', '#section-main-answers', '#section-main-text', '#section-main-progress', '#section-main-back']
    );
    $.get('https://www.musicmindproject.com:8443/backend/rest/question/questionCount', function (data, status) {
        if (status !== 'success') {
            printMessage('Error ' + status, 'Could not request Question Count from server!');
        } else {
            questionCount = parseInt(data);
            questionID = 0;
            displayQuestion();
        }
    });
}

/*-------------------------------------------------------------*/
/*Show current question to user*/
/*-------------------------------------------------------------*/
function displayQuestion() {
    $('#section-main-progress > div > div').animate({
        width: (questionID / questionCount) * 100 + '%'
    }, 100);

    $.get('https://www.musicmindproject.com:8443/backend/rest/question/' + questionID + '/en', function (data, status) {
        if (status !== 'success') {
            printMessage('Error ' + status, 'Could not request Question Nr.' + questionID + ' from server!');
        } else {
            if(questionID == questionCount - 1) {
                transitionFromTo(
                    ['#section-main-question', '#section-main-answers', '#section-main-text', '#section-main-progress', '#section-main-back'],
                    ['#section-main-question', '#section-main-name', '#section-main-progress']
                );
            }
            $('#section-main-question h3').fadeOut(200, function () {
                $(this).text(data).fadeIn(200);
                questionCompleted = false;
            });
        }
    });
}

/*-------------------------------------------------------------*/
/*called when user completes question*/
/*-------------------------------------------------------------*/
function completeQuestion(answer) {
    if (!questionCompleted) {
        questionCompleted = true;
        answers[questionID] = answer;
        questionID++;
        if (questionID < questionCount) displayQuestion();
        else submitQuestions();
    }
}

/*-------------------------------------------------------------*/
/*called when user wants to undo question*/
/*-------------------------------------------------------------*/
function undoQuestion() {
    if (questionID === 0) {
        questionID = undefined;
        transitionFromTo(
            ['#section-main-question', '#section-main-answers', '#section-main-text', '#section-main-progress', '#section-main-back'],
            ['#section-main-brain', '#section-main-title', '#section-main-button']
        );
    } else {
        questionID--;
        delete answers[questionID];
        displayQuestion();
    }
}

/*-------------------------------------------------------------*/
/*Submit questions to server*/
/*-------------------------------------------------------------*/
function submitQuestions() {
    answers[questionID] = userID;
    $.ajax({
        url: 'https://www.musicmindproject.com:8443/backend/rest/music/',
        contentType: 'application/json; charset=utf-8',
        type: 'POST',
        data: JSON.stringify(answers),
        success: function (result) {
            personality = {
                'neuroticism': result['neuroticism'],
                'extraversion': result['extraversion'],
                'openness': result['openness'],
                'agreeableness': result['agreeableness'],
                'conscientiousness': result['conscientiousness']
            };
            musicPath = result['pathToMusicTrack'];
            transitionFromTo(
                ['#section-main-question', '#section-main-answers', '#section-main-text', '#section-main-progress', '#section-main-back', '#section-main-name'],
                ['#section-main-headline', '#section-main-personality', '#section-main-info', '#section-main-actions']
            );

            displayPersonality();
            ga('send', 'event', 'personality', 'generate');
        }
    });
}

/*-------------------------------------------------------------*/
/*Show personality to user*/
/*-------------------------------------------------------------*/
function displayPersonality() {
    let traits = ['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness'];
    for (let i = 0; i < 5; i++) {
        anime({
            delay: 1000,
            targets: '#section-main-personality-' + traits[i],
            width: personality[traits[i]] + '%',
        });
    }
}

/*-------------------------------------------------------------*/
/*Download music via iframe from server*/
/*-------------------------------------------------------------*/
function downloadMusic() {
    window.open('https://www.musicmindproject.com:443/music/' + musicPath);
}

/*-------------------------------------------------------------*/
/*Get URL Paramters if existing*/
/*-------------------------------------------------------------*/
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};