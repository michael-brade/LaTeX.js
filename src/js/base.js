function getVariable(el, propertyName) {
    return String(getComputedStyle(el).getPropertyValue('--' + propertyName)).trim();
};

function processTheElements() {
    var thes = document.querySelectorAll('.the');
    for (var i = 0; i < thes.length; i++) {
        var v = thes[i].getAttribute('display-var');
        thes[i].textContent = getVariable(thes[i], v);
    }
}

function offsetTop(el) {
    var doc, docEl, rect, win;

    // return zero for disconnected and hidden (display: none) elements, IE <= 11 only
    // running getBoundingClientRect() on a disconnected node in IE throws an error
    if ( !el.getClientRects().length ) {
        return 0;
    }

    rect = el.getBoundingClientRect();

    doc = el.ownerDocument;
    docEl = doc.documentElement;
    win = doc.defaultView;

    return rect.top + win.pageYOffset - docEl.clientTop;
}


function positionMarginpars() {
    var mpars = document.querySelectorAll('.marginpar > div');
    var prevBottom = 0;

    mpars.forEach(function(mpar) {
        var mpref = document.querySelector('.body #marginref-' + mpar.id);
        var top = offsetTop(mpref);
        mpar.style.marginTop = top - prevBottom;
        prevBottom = top - prevBottom + mpar.offsetHeight
    });
}


function completed() {
	document.removeEventListener("DOMContentLoaded", completed);
	window.removeEventListener("load", positionMarginpars);

    var observer = new MutationObserver(function() {
        processTheElements();
        positionMarginpars();
    });

    observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });

    window.addEventListener('resize', positionMarginpars);

    processTheElements();
    positionMarginpars();
}

document.addEventListener("DOMContentLoaded", completed);
window.addEventListener("load", completed);
