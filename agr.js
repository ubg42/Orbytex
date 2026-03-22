const agr = (window) => {
	const { navigator, document, location } = window;
	const { currentScript } = document;

	if (!currentScript) return;

	const attr = (key, def, options = ["true", "false"]) => {
		const v = currentScript.getAttribute("data-" + key);
		if (v == null) return def;
		if (options) {
			return options.find((o) => o == v);
		}
		return v;
	};
	const slug = attr("site-id", null, null);
	const origin = new URL(currentScript.src).origin;
	const base_url = `${origin}/${slug}`
	const log_country = attr("country", "false") === "true";
	const log_device = attr("device", "false") === "true";
	const log_referrer = attr("referrer", "false") === "true";
	const log_path = attr("path", "false") === "true";
	const log_pageview = attr("pageview", "false") === "true";
	const is_auto = attr("auto", "true") === "true";
	const user_id = attr("user", undefined);

	const referrer = !!document.referrer ? new URL(document.referrer).host : null;
	const path = location.pathname;

	// check do not track
	if (parseInt(navigator.msDoNotTrack || window.doNotTrack || navigator.doNotTrack, 10) === 1)
		return;

	function send(path, payload) {
		try {
			return fetch(base_url + path, {
				method: "POST",
				body: JSON.stringify(payload),
				headers: { "Content-Type": "application/json" },
			});
		} catch (e) {
			return null;
		}
	}

	function log(country, device, once = null, always = null) {
		const payload = { country, device };
		if (once) payload.once = once;
		if (always) payload.always = always;
		if (user_id) payload.user_id = user_id;
		return send("/log", payload);
	}

	function collect(payload) {
		return send("/collect", payload);
	}

	if (!window.agr) {
		window.agr = { log, collect };
	}

	if (is_auto) {
		let once = null;
		let always = {};
		if (log_referrer && !!referrer) once = { referrer };
		if (log_path) always.path = path;
		if (log_pageview) always.users = "page_views";
		if (always == {}) always = null;
		log(log_country, log_device, once, always);
	}
}

try {
	agr(window);
} catch (e) {
	// fail silently
}
