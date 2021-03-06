import { useEffect, useState } from "react";
import { Coupon } from "../../../Models/Coupon";
import { CouponsListModel } from "../../../Models/models-lists/CouponsList";
import { ResponseDto } from "../../../Models/dto/ResponseDto";
import { couponsDownloadedAction } from "../../../Redux/CouponsAppState";
import store from "../../../Redux/Store";
import globals from "../../../Services/Globals";
import notify, { ErrMsg, SccMsg } from "../../../Services/Notification";
import { Utils } from "../../../Services/Utils";
import Avatar from "../../SharedArea/Avatar/Avatar";
import EmptyView from "../../SharedArea/EmptyView/EmptyView";
import GoMenu from "../../SharedArea/GoMenu/GoMenu";
import ILTime from "../../SharedArea/ILTime/ILTime";
import PurchaseButton from "../../UIArea/PurchaseButton/PurchaseButton";
import "./CouponsList.css";
import FilterSection from "../../UIArea/FilterSection/FilterSection";
import { customerCouponsAddedAction, customerCouponsDownloadedAction } from "../../../Redux/CustomerCouponsAppState";
import tokenAxios from "../../../Services/InterceptorAxios";
import { useNavigate } from "react-router-dom";

function CouponsList(): JSX.Element {

    const navigate = useNavigate();
    const [coupons, setCoupons] = useState<Coupon[]>(store.getState().couponsState.coupons);
    const [customerCoupons, setCustomerCoupons] = useState<Coupon[]>(store.getState().customerCouponsState.customerCoupons);
    const [rerender, setRerender] = useState(true);

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

        coupons?.length === 0 && getAllCouponsFromServer();
        customerCoupons?.length === 0 && getCustomerCouponsFromServer();

    }, [])

    const getCouponsFromFilter = (coupons: Coupon[]) => {
        coupons?.length > 0 ? setCoupons(coupons) : notify.error('no coupons from this filter');
    }

    const getAllCouponsFromServer = async () => {
        tokenAxios.get<CouponsListModel>(globals.urls.coupons)
            .then((response) => {
                store.dispatch(couponsDownloadedAction(response.data.coupons));
                setCoupons(response.data.coupons);
                notify.success(SccMsg.ALL_COUPONS);
            })
            .catch((err) => {
                notify.error(err);
            })
    }

    const getCustomerCouponsFromServer = async () => {
        tokenAxios.get<CouponsListModel>(globals.urls.customerCoupons)
            .then(response => {
                store.dispatch(customerCouponsDownloadedAction(response.data.coupons));
                setCustomerCoupons(response.data.coupons);
            })
            .catch(err => {
                notify.error(err);
            })
    }

    const purchaseCoupon = async (couponId: number) => {
        tokenAxios.get<ResponseDto>(globals.urls.customer + '/purchaseCoupon/' + couponId)
            .then(response => {
                if (response.data.success) {
                    notify.success(response.data.message);
                    store.dispatch(customerCouponsAddedAction(coupons.find(coupon => coupon.id === couponId)));
                    setCustomerCoupons(store.getState().customerCouponsState.customerCoupons);
                    setRerender(!rerender);
                }
            })
            .catch((err) => {
                switch (err.response?.status) {
                    case 401: // unauthorized
                        notify.error(ErrMsg.UNAUTHORIZED_OPERATION);
                        break;
                    case 403: // forbidden
                        notify.error(err.response.data);
                        break;
                    default:
                        notify.error(err);
                }
            })
    }

    const isCouponPurchased = (couponId: number) => {
        let isPurchased = false;

        customerCoupons.forEach(coupon => {
            if (coupon.id === couponId) {
                isPurchased = true;
            }
        })

        return isPurchased;
    }

    return (
        <div className="CouponsList">
            {coupons?.length > 0 && <><h2 className="display-5">All coupons</h2>
                <FilterSection filterCb={getCouponsFromFilter} model="coupon" />
                <div className="row">
                    {coupons.map(coupon => {
                        return [
                            <div className="card" style={{ width: "19rem" }} key={coupon.id} >

                                <Avatar className="card-img-top" uuid={coupon.image} />
                                <div className="card-body">
                                    <h4 className="card-title">{coupon.title}</h4>
                                    <h5>{Utils.lowerCaseAndCapitalizeFirstLetter(coupon.category.toString())}</h5>
                                    <div className="description-box"><p className="card-text">{coupon.description}</p></div>

                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item"><span>start date: </span><ILTime date={coupon.startDate} /></li>
                                        <li className="list-group-item"><span>end date: </span><ILTime date={coupon.endDate} /></li>
                                        <li className="list-group-item"><span>Price: </span>{coupon.price.toFixed(2)}$</li>
                                        <li className="list-group-item"><span>{isCouponPurchased(coupon.id) ? <div className="purchased-msg">purchased</div> :
                                            (<PurchaseButton cb={purchaseCoupon} couponId={coupon.id} couponTitle={coupon.title} />)
                                        }</span></li>
                                    </ul>
                                </div>
                            </div>
                        ]
                    })}

                    <GoMenu to='/customer' />
                </div></>}

            {coupons?.length === 0 && <><EmptyView message='Ooops.. No coupons to display!' /><GoMenu to='/customer' /></>}
        </div>
    );
}

export default CouponsList;
