/*-------------------------------------------------------------*/
/*Download and init google analytics*/
/*-------------------------------------------------------------*/

(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-109816817-1', 'auto');
ga('send', 'pageview');

/*-------------------------------------------------------------*/
/*Init JS*/
/*-------------------------------------------------------------*/
let audio = new Audio();
let userID = undefined;

$(function () {

    ga(function(tracker) {
        userID = tracker.get('clientId');
    });

    /*Show tooltips*/
    $('[data-toggle="tooltip"]').tooltip();

    /*enable scrollto buttons*/
    $('.scrollto').click(function () {
        let elem = $('#' + $(this).attr('scrollto'));
        $('html, body').animate({
            scrollTop: elem.offset().top
        }, 1000);
    });

    $('#section-header-search').change(function() {
        getMusic('name=' + $(this).val(), 0, 50);
    });

    $('#section-header-a-1').click(function() {
        getMusic('hottest', 0, 50);
    });

    $('#section-header-a-2').click(function() {
        getMusic('newest', 0, 50);
    });

    getMusic('newest', 0, 50);

    //Test purpose
    for (let i = 0; i < 100; i++) {
        createItem({
            name: 'Hauer',
            id: 'ads',
            neuroticism: Math.random() * 100,
            extraversion: Math.random() * 100,
            openness: Math.random() * 100,
            agreeableness: Math.random() * 100,
            conscientiousness: Math.random() * 100,
            shares: Math.round(Math.random() * 100),
            plays: Math.round(Math.random() * 100),
        });
    }
});

function getMusic(query, min, max) {
    clearItems();
    $.get('https://www.musicmindproject.com:8443/backend/rest/music/' + query + '/' + min + '/' + max, function (data, status) {
        if (status !== 'success') {
            printMessage(false, 'Error ' + status, 'Could not request Page clicks from server!');
        }
        else {
            $.each(data, function(key, value) {
                createItem(value);
            });
        }
    });
}

function clearItems() {
    $('#section-elements > .row').empty();
}

function createItem(data) {
    let styles = ['light', 'medium'];
    let items = $('#section-elements > .row');
    let item = $('#section-elements-hidden .element').first().clone();

    item.addClass(styles[items.children().length % 2]);

    let traits = ['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness'];
    for (let i = 0; i < traits.length; i++) {
        item.find('.personality-' + traits[i]).width(data[traits[i]] + '%');
    }
    item.find('.element-headline').text(data['name'] + '\'s Music');
    item.find('.element-shares').text(data['shares'] + ' shares');
    item.find('.element-plays').text(data['plays'] + ' plays');
    item.find('.element-more').click(function() {
        window.location.href = 'https://www.musicmindproject.com/?id=' + data['id'];
    });
    item.find('.element-play button').click(function() {
        let play = {
            player: userID,
            played: data['id']
        };
        $.ajax({
            url: 'https://www.musicmindproject.com:8443/music/play',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            type: 'POST',
            data: JSON.stringify(play)
        });
        audio.src = 'https://www.musicmindproject.com:8443/music/' + data['musicPath'];
        audio.play();
    });

    items.append(item);
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
