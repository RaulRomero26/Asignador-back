/*
    Este controlador se encarga de los enpoint de notificaciones
*/


//se importan la request y la response de express para tener el tipado
const { response, request } = require('express');

const webPush = require('web-push');
//se importa el conector con la base de datos
const { tareasPromisePool } = require('../database/configTareas');


// Configura tus claves VAPID (puedes generarlas con web-push.generateVAPIDKeys())
const vapidKeys = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY
  };
  
  webPush.setVapidDetails('mailto:raul.romerod26@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

  const saveSubscription = (req, res) => {
    // Extract subscription and ID from the request
    const {subscription, user_id} = req.body;

    tareasPromisePool.query(`INSERT INTO notifications (user_id, subscription) VALUES (?, ?)`, [user_id, subscription]);    // Log the subscription from the request
    // console.log('Subscription from request:', subscription);
    // // Store the subscription in the object under the key ID
    // subscriptions[id] = subscription;
    // // Log the subscription from the subscriptions object
    // console.log('Subscription from subscriptions object:', subscriptions[id]);
    // Return a successful status
    return res.status(201).json({data: {success: true}});
};

const sendNotification = async(req, res) => {
    // Extract message, title, and ID from the request
    const {message, title, user_id} = req.body;
    // Find the subscription by ID
    console.log(message, title, user_id)
    let subscription = await tareasPromisePool.query(`SELECT * FROM notifications WHERE user_id = ?`, [user_id]);
    console.log(subscription)
    // const subscription = subscriptions[id];
    console.log('AL QUE LE DEBEN DE LLEGAR', subscription[0])

    let obj_subscription = JSON.parse(subscription[0][0].subscription)
    // Check if the subscription exists and has an endpoint
    if (!obj_subscription || !obj_subscription.endpoint) {
        return res.status(400).json({data: {success: false, message: 'Subscription not found or invalid'}});
    }
    // Create the payload for the push notification
    const payload = JSON.stringify({ title, message });
    // Send the push notification
    webPush.sendNotification(obj_subscription, payload)
    .then((value) => {
        // Return a 201 status in case of successful sending
        console.log(value)
        return res.status(201).json({data: {success: true}});
    })
    .catch(error => {
        // Return a 400 status in case of an error
        return res.status(400).json({data: {success: false}});
    });
}


module.exports = {
    saveSubscription,
    sendNotification
}