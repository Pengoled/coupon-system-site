import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { Coupon } from "../../../Models/Coupon";
import { CouponsListModel } from "../../../Models/models-lists/CouponsList";
import { customerCouponsDownloadedAction } from "../../../Redux/CustomerCouponsAppState";
import store from "../../../Redux/Store";
import globals from "../../../Services/Globals";
import tokenAxios from "../../../Services/InterceptorAxios";
import notify, { ErrMsg, SccMsg } from "../../../Services/Notification";
import { Utils } from "../../../Services/Utils";
import Avatar from "../../SharedArea/Avatar/Avatar";
import EmptyView from "../../SharedArea/EmptyView/EmptyView";
import GoMenu from "../../SharedArea/GoMenu/GoMenu";
import ILTime from "../../SharedArea/ILTime/ILTime";
import FilterSection from "../../UIArea/FilterSection/FilterSection";
import "./CustomerCoupons.css";

function CustomerCoupons(): JSX.Element {

    const [coupons, setCoupons] = useState<Coupon[]>(store.getState().customerCouponsState.customerCoupons);
    const navigate = useNavigate();

    useEffect(() => {
        if (!store.getState().authState?.user) {
            notify.error(ErrMsg.PLS_LOGIN);
            navigate('/login');
            return;
        }

        if (store.getState().authState?.user?.clientType.toString() !== 'CUSTOMER') {
            notify.error(ErrMsg.UNAUTHORIZED);
            navigate('/');
            return;
        }

        coupons.length === 0 && getCoupons();
        
    }, [])

    const getCouponsFromFilter = (coupons: Coupon[]) => {
        coupons?.length > 0 ? setCoupons(coupons) : notify.error('no coupons from this filter');
    }

    const getCoupons = async () => {
        tokenAxios.get<CouponsListModel>(globals.urls.customerCoupons)
            .then(response => {
                setCoupons(response.data.coupons);
                store.dispatch(customerCouponsDownloadedAction(response.data.coupons));
                notify.success(SccMsg.ALL_CUSTOMER_COUPONS);
            })
            .catch(err => {
                notify.error(err)
            })
    }

    return (
        <div className="CustomerCoupons">
            {coupons?.length > 0 && <><h2 className="display-5">Purchased Coupons</h2>
                <FilterSection filterCb={getCouponsFromFilter} model="customer" />
                <div className="row">
                    {coupons.map(coupon => {
                        return [
                            <div className="card" style={{ width: "19rem" }} key={coupon.id} >

                                <Avatar className="card-img-top" uuid={coupon.image} />
                                <div className="card-body">
                                    <h4 className="card-title">{coupon.title}</h4>
                                    <h5>{Utils.lowerCaseAndCapitalizeFirstLetter(coupon.category.toString())}</h5>
                                    <p className="card-text">{coupon.description}</p>

                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item"><span>start date: </span><ILTime date={coupon.startDate} /></li>
                                        <li className="list-group-item"><span>end date: </span><ILTime date={coupon.endDate} /></li>
                                        <li className="list-group-item"><span>Price: </span>{coupon.price.toFixed(2)}$</li>
                                    </ul>
                                </div>
                            </div>
                        ]
                    })}

                    <GoMenu to='/customer' />
                </div></>}

            {coupons?.length === 0 && <><EmptyView message='No coupons have been purchased!' />
                <GoMenu to='/customer' />
                <Link to="/customer/coupons"><Button variant="outline-primary">View all coupons</Button></Link></>}
        </div >
    );
}

export default CustomerCoupons;
