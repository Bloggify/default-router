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

    let blogPageFn = ctx => {
        let pageNumber = ctx.params.pageNumber = parseInt(ctx.params.pageNumber);

        if (pageNumber < 1 || isNaN(pageNumber)) {
            return ctx.next();
        }

        this.emit("blog_page", ctx);
    };

    let sitePageUrl = "/:sitePage";
    if (config.paths.blog !== "/") {
        sitePageUrl += "?";
    }

    // Blog pages
    if (typeof config.paths.blog === "string") {
        // Article pages
        let articleHandler = ctx => {
            let articleId = ctx.params.articleId = parseInt(ctx.params.articleId);
            if (articleId < 1 || isNaN(articleId)) {
                if (ctx.path === "/blog" && !config.paths.blog) {
                    return ctx.redirect("/");
                }
                return ctx.next();
            }

            this.emit("article", ctx);
        };

        bloggify.server.addPage(config.paths.articlePath + "/:articleId-:articleSlug?", articleHandler);
        bloggify.server.addPage(config.paths.articlePath + "/:articleId", articleHandler);

        bloggify.server.addPage(config.paths.blog + "/page/:pageNumber", blogPageFn);

        bloggify.server.addPage(config.paths.blog || "/", ctx => {
            ctx.params.pageNumber = 1;
            blogPageFn(ctx);
        });
    }

    // Site pages
    bloggify.server.addPage(sitePageUrl, ctx => {
        if (!ctx.params.sitePage) {
            ctx.params.sitePage = config.paths.home;
        }
        this.emit("site_page", ctx);
    });

    bloggify.on("plugins-loaded", () => {
        // Handle the error pages
        bloggify.server.errorPages({
            notFound: ctx => {
                this.emit("not_found", ctx);
            }
          , serverError: ctx => {
                this.emit("server_error", ctx);
            }
        });
    });

    exports.blogPath = config.paths.blog;
    exports.blogPagePath = config.paths.blog + "/page";
    exports.homePath = config.paths.home;
    exports.articlePath = config.paths.articlePath;
};
