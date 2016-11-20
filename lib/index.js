"use strict";

exports.init = function (config, bloggify) {

    config.paths.blog = config.paths.blog.replace(/\/$/, "");

    bloggify.registerRouter(exports);

    if (config.paths.home && config.paths.blog === "/") {
        bloggify.log("You cannot have a blog page same with with a site page on the home page.");
    }

    let blogPageFn = lien => {
        let pageNumber = lien.params.pageNumber = parseInt(lien.params.pageNumber);

        if (pageNumber < 1 || isNaN(pageNumber)) {
            return lien.next();
        }

        this.emit("blog_page", lien);
    };

    let sitePageUrl = "/:sitePage";

    // Blog pages
    if (typeof config.paths.blog === "string") {
        // Article pages
        bloggify.server.addPage(config.paths.blog + "/:articleId-?:articleSlug?", lien => {
            let articleId = lien.params.articleId = parseInt(lien.params.articleId);


            if (articleId < 1 || isNaN(articleId)) {
                if (lien.path === "/blog" && !config.paths.blog) {
                    return lien.redirect("/");
                }
                return lien.next();
            }

            this.emit("article", lien);
        });

        bloggify.server.addPage(config.paths.blog + "/page/:pageNumber", blogPageFn);

        if (config.paths.blog !== "/") {
            sitePageUrl += "?";
        }

        bloggify.server.addPage(config.paths.blog || "/", lien => {
            lien.params.pageNumber = 1;
            blogPageFn(lien);
        });
    }

    // Site pages
    bloggify.server.addPage(sitePageUrl, lien => {
        if (!lien.params.sitePage) {
            lien.params.sitePage = config.paths.home;
        }
        this.emit("site_page", lien);
    });

    // Handle the error pages
    bloggify.server.errorPages({
        notFound: lien => {
            this.emit("not_found", lien);
        }
      , serverError: lien => {
            this.emit("server_error", lien);
        }
    });

    exports.blogPath = config.paths.blog;
    exports.homePath = config.paths.home;
};
