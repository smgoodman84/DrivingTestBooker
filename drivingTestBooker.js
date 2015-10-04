// Run Using PhantomJS

var page = require('webpage').create(),
    server = require('webserver').create(),
    system = require('system'),
	fs = require('fs'),
    url = 'https://driverpracticaltest.direct.gov.uk/',
	
	driverLicenceNumber = 'SURNA110045FM9AB',
	preferredTestDate = '04/10/15';

checkCentre('Cambridge (Chesterton Road)', 12);
		
function checkCentre(testcentre, centreId) {
	folder = 'centre' + centreId;
	log('Checking ' + testcentre, true);
	openPage(1, url, 'GET', '');

	function debug(message) {
		log(message,false,true);
	}
	
	function log(message, reset, debug) {
		debug = debug || false;
		reset = reset || false;
		mode = reset ? 'w' : 'a';
		fs.write(folder + '/log.txt', message + '\r\n', mode);
		
		if (debug == true) {
			return;
		}
		
		console.log(message);
	}
	
	function openPage(pageNumber, url, method, body) {
		debug('Loading page ' + pageNumber + ': ' + url);
		return page.open(url, method, body, getHandlePage(pageNumber));
	}

	function getHandlePage(pageNumber) {
		return function handlepage(status) {
			if (status !== 'success') {
				debug('Loading page ' + pageNumber + ' failed');
				phantom.exit();
			} 
			debug('Loading page ' + pageNumber + ' succeeded');
			
			page.render(folder + '/screen0' + pageNumber + '.png');
			fs.write(folder + '/page0' + pageNumber + '.html', page.content, 'w');
			
			whatToDo = pageHandler(pageNumber, page);
			openPage(pageNumber + 1, whatToDo.url, whatToDo.method, whatToDo.body);
		};
	};

	function pageResult(url, method, body) {
		return {
			url: url,
			method: method,
			body: body
		};
	}
	
	function standardFormHandler(page, postData) {
		var form = page.evaluate(function() {
			return document.getElementsByTagName("form")[0];
		});
		
		return pageResult(form.action, 'POST', postData);
	}

	function linkByIdHandler(page, elementId) {
		var a = page.evaluate(function(elementId) {
			return document.getElementById(elementId);
		}, elementId);
		
		return pageResult(a.href, 'GET', '');
	}

	function pageHandler(pageNumber, page) {
		switch(pageNumber) {
			case 1: return standardFormHandler(page, 'testTypeCar=Car (manual and automatic)');
			case 2: return standardFormHandler(page, 'driverLicenceNumber=' + driverLicenceNumber + '&extendedTest=false&specialNeeds=false');
			case 3: return standardFormHandler(page, 'testCentreName=' + testcentre);
			case 4: return linkByIdHandler(page, "centre-" + centreId);
			case 5: return standardFormHandler(page, 'testChoice=DATE&preferredTestDate=' + preferredTestDate + '&instructorPRN=');
			case 6: return handlePage6(page);
		}
	};
	
	function handlePage6(page) {
		displayResult(page);
		
		if (centreId == 548) {
			phantom.exit();
		} else {
			checkCentre('Cambridge (Cowley Road)', 548);
		}
	}
	
	function displayResult(page) {
		if (page.content.indexOf("There are no tests available that meet your request") > -1) {
			log("There are no tests available that meet your request");
			return;
		}
		if (page.content.indexOf("Please complete the additional security question") > -1) {
			log("Please complete the additional security question");
			return;
		}
		
		log("Figure out what's happened");
	}
};