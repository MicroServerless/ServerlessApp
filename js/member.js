/*global ServerlessApp _config*/

var ServerlessApp = window.ServerlessApp || {};
ServerlessApp.map = ServerlessApp.map || {};

(function rideScopeWrapper($) {
    var authToken;
    ServerlessApp.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestUnicorn(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.gender === 'Male' ? 'his' : 'her';
        displayUpdate(unicorn.name + ', your ' + unicorn.color + ' unicorn, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.name + ' has arrived. Giddy up!');
            ServerlessApp.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $('#signOut').click(handleSignOutRequestClick);
        $(ServerlessApp.map).on('pickupChange', handlePickupChanged);

        ServerlessApp.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = ServerlessApp.map.selectedPoint;
        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    function handleSignOutRequestClick() {
        ServerlessApp.signOut();
        window.location.href = '/signin.html';
    }

    function animateArrival(callback) {
        var dest = ServerlessApp.map.selectedPoint;
        var origin = {};

        if (dest.latitude > ServerlessApp.map.center.latitude) {
            origin.latitude = ServerlessApp.map.extent.minLat;
        } else {
            origin.latitude = ServerlessApp.map.extent.maxLat;
        }

        if (dest.longitude > ServerlessApp.map.center.longitude) {
            origin.longitude = ServerlessApp.map.extent.minLng;
        } else {
            origin.longitude = ServerlessApp.map.extent.maxLng;
        }

        ServerlessApp.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
