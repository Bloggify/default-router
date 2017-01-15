"use strict";

exports.init = function (config, bloggify) {

    if (config.paths.blog) {
        config.paths.blog = config.paths.blog.replace(/\/$/, "");
    }

    bloggify.registerRouter(exports);

    if (config.paths.home && config.paths.blog === "/") {
        bloggify.log("You cannot have a blog page same with with a site page on the home page.");
    }

    config.paths.articlePath = config.paths.articlePath || config.paths.blog;

    let blogPageFn = lien => {
        let pageNumber = lien.params.pageNumber = parseInt(lien.params.pageNumber);

        if (pageNumber < 1 || isNaN(pageNumber)) {
            return lien.next();
        }

        this.emit("blog_page", lien);
    };

    let sitePageUrl = "/:sitePage";
    if (config.paths.blog !== "/") {
        sitePageUrl += "?";
    }

    // Blog pages
    if (typeof config.paths.blog === "string") {
        // Article pages
        let articleHandler = lien => {
            let articleId = lien.params.articleId = parseInt(lien.params.articleId);
            if (articleId < 1 || isNaN(articleId)) {
                if (lien.path === "/blog" && !config.paths.blog) {
                    return lien.redirect("/");
                }
                return lien.next();
            }

            this.emit("article", lien);
        };

        bloggify.server.addPage(config.paths.articlePath + "/:articleId-:articleSlug?", articleHandler);
        bloggify.server.addPage(config.paths.articlePath + "/:articleId", articleHandler);

        bloggify.server.addPage(config.paths.blog + "/page/:pageNumber", blogPageFn);

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

    bloggify.on("plugins-loaded", () => {
        // Handle the error pages
        bloggify.server.errorPages({
            notFound: lien => {
                this.emit("not_found", lien);
            }
          , serverError: lien => {
                this.emit("server_error", lien);
            }
        });
    });

    exports.blogPath = config.paths.blog;
    exports.blogPagePath = config.paths.blog + "/page";
    exports.homePath = config.paths.home;
    exports.articlePath = config.paths.articlePath;
};
