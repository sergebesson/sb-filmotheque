"use strict";
/* global Vue,axios,localStorage */

Vue.component("flash", {
	data: function () {
		return {
			show: false,
			title: "",
			content: "",
		};
	},
	created: function () {
		this.showFlash()
			.catch((error) => this.$emit(
				"error", "Impossible de récupérer les informations de l'api", error
			));
	},
	methods: {
		showFlash: function () {
			return axios({
				method: "get",
				url: "api/infos",
			})
				.then(({ data }) => {
					const lastVersion = localStorage.getItem("last_version") || "0.0.0";
					if (this.comparedVersion(data.version, lastVersion) > 0 && data.flash) {
						localStorage.setItem("last_version", data.version);
						this.title = `Filmotheque version: ${ data.version }`;
						this.content = data.flash;
						this.show = true;
					}
				});
		},
		comparedVersion(version1, version2) {
			const [ major1, minor1, patch1 ] = version1.split(".");
			const [ major2, minor2, patch2 ] = version2.split(".");

			if (major1 !== major2) {
				return major1 > major2 ? 1 : -1;
			}
			if (minor1 !== minor2) {
				return minor1 > minor2 ? 1 : -1;
			}
			if (patch1 !== patch2) {
				return patch1 > patch2 ? 1 : -1;
			}

			return 0;
		},
	},
	template: `
		<md-dialog-alert class="flash"
			:md-active.sync="show"
			:md-title="title"
			:md-content="content"
		/>
	`,
});
