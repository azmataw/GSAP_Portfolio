import { Link } from "react-router-dom";
export default function Topbar() {
    return (
        <div className="topbar container-2200 d-none d-md-block bg-neutral-900 changeless mx-lg-3 mx-2">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="date">
                                <p className="fz-font-label text-white my-0">
                                    I-8 Markaz, Islamabad, Pakistan
                                </p>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                                <a href="tel:+923453056396" className="fz-font-label fw-500 text-white">
                                    <span>+92 345 305 6396</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
