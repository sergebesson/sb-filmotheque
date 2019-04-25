"use strict";

const _ = require("lodash");
const moment = require("moment");
// eslint-disable-next-line new-cap
const router = require("express").Router();
const path = require("path");

const { Users } = require("../users.js");
const { Filmotheque } = require("../filmotheque.js");

module.exports = ({ configLoader, logger }) => {

	const filmotheque = new Filmotheque(configLoader.getValue("storage.databaseDirectory"), logger);

	router.use(function (request, response, next) {
		return Users.checkRouteAccessRights(request.auth.user, request.path) ?
			next() :
			response.status(403).json({
				status: 403,
				error_description: "Forbidden",
			});
	});

	router.get("/initialize", function (request, response, next) {
		filmotheque.initialize(configLoader.getValue("storage.moviesDirectory"))
			.then((result) => response.status(200).send(result))
			.catch(next);
	});

	router.get("/infos", function (request, response, next) {
		filmotheque.infos()
			.then((infos) => response.status(200).send(infos))
			.catch(next);
	});

	router.get("/films", function (request, response, next) {
		if (request.query.group_by && request.query.group_by !== "dateAdded") {
			return next(new Error("invalid_group_by"));
		}

		return filmotheque.find(request.query.filter)
			.then((films) => {
				const responseFilms = request.query.group_by === "dateAdded" ?
					_.chain(films)
						.sortBy("dateAdded")
						.reverse()
						.groupBy((film) => moment(film.dateAdded).set({
							hour: 0, minute: 0, second: 0, millisecond: 0,
						}).toISOString())
						.value() :
					films;
				response.status(200).send(responseFilms);
			})
			.catch(next);
	});

	router.get("/download/:id", function (request, response, next) {
		filmotheque.get(request.params.id)
			.then((film) => {
				if (!film) {
					return next();
				}
				response.download(
					path.join(configLoader.getValue("storage.moviesDirectory"), film.fileName)
				);
			})
			.catch(next);
	});

	router.use(function (request, response) {
		return response.status(404).json({
			status: 404, error_description: "not_found",
		});
	});

	// Route d'erreur
	// eslint-disable-next-line no-unused-vars
	router.use(function (error, request, response, next) {
		logger.log("error", error.stack);
		response.status(500).json({
			status: 500, error_description: error.message,
		});
	});

	return router;
};